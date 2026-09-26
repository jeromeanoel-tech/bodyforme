import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'
import { getMelbDate, getMelbDayTime, getMelbFirstOccurrence, melbToUtc } from '@/lib/dates'

function getClient() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
    (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
  )
}

const DAY_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

async function getOrCreateServiceId(className: string): Promise<string | undefined> {
  const supabase = getClient()
  const { data: existing } = await supabase.from('services').select('id').eq('name', className).limit(1)
  if (existing?.[0]?.id) return existing[0].id
  const { data: created } = await supabase.from('services')
    .insert({ name: className, description: '', duration: 60, capacity: 20 })
    .select('id').single()
  return created?.id
}

/**
 * Find all future non-cancelled sessions for a service on a specific Melbourne weekday.
 *
 * Matches by service_id (stable class identifier) + day-of-week in Melbourne timezone.
 * This is immune to time drift: it finds sessions regardless of what time they're currently
 * stored at — so a previous failed update can never permanently hide sessions from this query.
 */
async function sessionsOnDay(
  supabase: ReturnType<typeof getClient>,
  serviceId: string,
  day: string,
): Promise<Array<{ id: string; start_time: string; end_time: string }>> {
  const { data } = await supabase
    .from('sessions')
    .select('id, start_time, end_time')
    .eq('service_id', serviceId)
    .neq('status', 'CANCELLED')
    .gt('start_time', new Date().toISOString())
    .limit(5000)

  return (data ?? []).filter(s => getMelbDayTime(s.start_time).day === day)
}

/**
 * Used only by the admin Sync button: find sessions at a specific Melbourne day+time slot.
 * Returns all non-cancelled future sessions at that slot regardless of class name.
 */
async function sessionsAtSlot(day: string, startHHMM: string) {
  const supabase = getClient()
  const { data } = await supabase
    .from('sessions')
    .select('id, title, start_time, end_time, service_id')
    .neq('status', 'CANCELLED')
    .gt('start_time', new Date().toISOString())
    .limit(5000)

  return (data ?? []).filter(s => {
    const { day: sDay, time } = getMelbDayTime(s.start_time)
    return sDay === day && time === startHHMM
  })
}

/**
 * Seed sessions for the next 12 weeks at a specific Melbourne weekday+time.
 * Only inserts rows that don't already exist at the exact UTC start_time.
 */
async function seedSessions(day: string, startHHMM: string, endHHMM: string, className: string, instructor: string) {
  const supabase = getClient()
  const firstMelbDate = getMelbFirstOccurrence(day)
  const [fy, fm, fd]  = firstMelbDate.split('-').map(Number)

  const serviceId = await getOrCreateServiceId(className)
  if (!serviceId) return

  const inserts: object[] = []
  for (let week = 0; week < 12; week++) {
    const melbDate = new Date(Date.UTC(fy, fm - 1, fd + week * 7)).toISOString().slice(0, 10)
    const startISO = melbToUtc(melbDate, startHHMM)
    const endISO   = melbToUtc(melbDate, endHHMM)

    const { data: existing } = await supabase.from('sessions')
      .select('id, status').eq('service_id', serviceId).eq('start_time', startISO).maybeSingle()

    if (existing) {
      if (existing.status === 'CANCELLED') {
        await supabase.from('sessions').update({ status: 'CONFIRMED', instructor_name: instructor, end_time: endISO }).eq('id', existing.id)
      }
      continue
    }

    inserts.push({ service_id: serviceId, title: className, instructor_name: instructor, start_time: startISO, end_time: endISO, capacity: 20, status: 'CONFIRMED' })
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from('sessions').insert(inserts)
    if (error) console.error('[seedSessions] insert failed:', error.message)
  }
}

function revalidateAll() {
  revalidatePath('/classes')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/checkin')
  revalidatePath('/app/schedule')
}

// ── GET — return all template rows ───────────────────────────────────────────

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getClient()
  const { data, error } = await supabase.from('schedule_template').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sorted = (data ?? []).sort((a, b) => {
    const d = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
    return d !== 0 ? d : a.start_time.localeCompare(b.start_time)
  })

  return NextResponse.json({ rows: sorted })
}

// ── POST — add a slot and seed 12 weeks of sessions ──────────────────────────

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const day        = (body.day ?? '').toLowerCase().trim()
  const start_time = body.start_time
  const end_time   = body.end_time
  const class_name = body.class_name
  const instructor = body.instructor
  if (!day || !start_time || !end_time || !class_name) {
    return NextResponse.json({ error: 'day, start_time, end_time and class_name are required' }, { status: 400 })
  }

  const supabase = getClient()
  const { data, error } = await supabase
    .from('schedule_template')
    .insert({ day, start_time, end_time, class_name, instructor: instructor ?? '' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await seedSessions(day, start_time, end_time, class_name, instructor ?? '')
  revalidateAll()
  return NextResponse.json({ row: data })
}

// ── PUT — update a slot, propagate changes to all matching future sessions ────

export async function PUT(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, start_time, end_time, class_name, instructor, resync } = body
  const day     = (body.day ?? '').toLowerCase().trim()
  const old_day = body.old_day ? (body.old_day as string).toLowerCase().trim() : undefined
  const { old_start_time, old_class_name } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getClient()
  const { data, error } = await supabase
    .from('schedule_template')
    .update({ day, start_time, end_time, class_name, instructor })
    .eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Sync button: fix service_id mismatches and cancel wrong classes at this slot ──
  if (resync) {
    const serviceId = await getOrCreateServiceId(class_name)
    const atSlot    = await sessionsAtSlot(day, start_time)
    const correct   = atSlot.filter(s => s.title === class_name)
    const wrong     = atSlot.filter(s => s.title !== class_name)
    if (serviceId) {
      for (const s of correct) {
        await supabase.from('sessions').update({ service_id: serviceId, instructor_name: instructor }).eq('id', s.id)
      }
    }
    if (wrong.length > 0) {
      await supabase.from('sessions').update({ status: 'CANCELLED' }).in('id', wrong.map(s => s.id))
    }
    await seedSessions(day, start_time, end_time, class_name, instructor ?? '')
    revalidateAll()
    return NextResponse.json({ row: data, resynced: correct.length, cancelled: wrong.length })
  }

  // ── Normal save: propagate time/name/instructor changes to future sessions ──
  //
  // Strategy: look up sessions by service_id + Melbourne day-of-week — NOT by time.
  // This means sessions are found even if they were previously stuck at the wrong time
  // due to a past failed update. No time-matching means no "can't find sessions" failure.

  const targetDay    = old_day ?? day
  const dayChanged   = old_day !== undefined && old_day !== day
  const timeChanged  = start_time !== old_start_time
  const nameChanged  = class_name !== (old_class_name ?? class_name)

  const oldClassName = old_class_name ?? class_name
  const oldServiceId = await getOrCreateServiceId(oldClassName)
  const newServiceId = nameChanged ? await getOrCreateServiceId(class_name) : oldServiceId

  let updatedCount = 0

  if (oldServiceId) {
    const toUpdate = await sessionsOnDay(supabase, oldServiceId, targetDay)
    updatedCount = toUpdate.length

    if (dayChanged) {
      // Day change: cancel sessions on old day and seed fresh on new day below
      if (toUpdate.length > 0) {
        await supabase.from('sessions').update({ status: 'CANCELLED' }).in('id', toUpdate.map(s => s.id))
      }
    } else {
      // Same day: update each session's time / name / instructor in place
      for (const s of toUpdate) {
        const melbDate = getMelbDate(new Date(s.start_time))
        const upd: Record<string, unknown> = {
          instructor_name: instructor,
          title:           class_name,
          service_id:      newServiceId ?? oldServiceId,
        }
        if (timeChanged) {
          upd.start_time = melbToUtc(melbDate, start_time)
          upd.end_time   = melbToUtc(melbDate, end_time)
        }
        await supabase.from('sessions').update(upd).eq('id', s.id)
      }
    }
  }

  // Seed any weeks that are missing sessions at the new day+time
  await seedSessions(day, start_time, end_time, class_name, instructor ?? '')
  revalidateAll()

  return NextResponse.json({ row: data, updated: updatedCount })
}

// ── DELETE — remove a slot and cancel all future sessions for that class+day ─

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, day, class_name } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getClient()
  const { error } = await supabase.from('schedule_template').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Cancel all future sessions for this class on this day, regardless of what time
  // they're currently stored at — so a drifted or previously-failed session is still caught.
  const serviceId = await getOrCreateServiceId(class_name)
  let cancelledCount = 0
  if (serviceId) {
    const sessions = await sessionsOnDay(supabase, serviceId, day)
    if (sessions.length > 0) {
      await supabase.from('sessions').update({ status: 'CANCELLED' }).in('id', sessions.map(s => s.id))
      cancelledCount = sessions.length
    }
  }

  revalidateAll()
  return NextResponse.json({ cancelled: cancelledCount })
}
