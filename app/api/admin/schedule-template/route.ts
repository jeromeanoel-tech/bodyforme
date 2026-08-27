import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'
import { getMelbDate, getMelbFirstOccurrence, melbToUtc } from '@/lib/dates'

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

async function matchingSessions(day: string, startHHMM: string, className: string, forceByTime = false) {
  const supabase = getClient()
  const base = supabase.from('sessions').select('id, title, start_time, end_time')
    .neq('status', 'CANCELLED').gt('start_time', new Date().toISOString())
  const { data } = await (forceByTime ? base : base.eq('title', className))

  return (data ?? []).filter(s => {
    const parts = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Melbourne',
      weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(s.start_time))
    const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? ''
    const h  = parts.find(p => p.type === 'hour')?.value   ?? '00'
    const mi = parts.find(p => p.type === 'minute')?.value ?? '00'
    return weekday === day && `${h.padStart(2,'0')}:${mi.padStart(2,'0')}` === startHHMM
  })
}

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

    const nearStart = new Date(new Date(startISO).getTime() - 59 * 60 * 1000).toISOString()
    const nearEnd   = new Date(new Date(startISO).getTime() + 59 * 60 * 1000).toISOString()
    const { data: nearbySession } = await supabase.from('sessions')
      .select('id')
      .eq('service_id', serviceId)
      .gte('start_time', nearStart)
      .lte('start_time', nearEnd)
      .neq('status', 'CANCELLED')
      .maybeSingle()
    if (nearbySession) continue

    inserts.push({ service_id: serviceId, title: className, instructor_name: instructor, start_time: startISO, end_time: endISO, capacity: 20, status: 'CONFIRMED' })
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from('sessions').insert(inserts)
    if (error) console.error('[seedSessions] insert failed:', error.message)
  }
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
  revalidatePath('/classes')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/checkin')
  revalidatePath('/app/schedule')
  return NextResponse.json({ row: data })
}

// ── PUT — update a slot, propagate changes to future sessions ─────────────────

export async function PUT(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, start_time, end_time, class_name, instructor, resync } = body
  const day     = (body.day ?? '').toLowerCase().trim()
  const old_day = body.old_day ? (body.old_day as string).toLowerCase().trim() : undefined
  const { old_start_time, old_end_time, old_class_name } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getClient()
  const { data, error } = await supabase
    .from('schedule_template')
    .update({ day, start_time, end_time, class_name, instructor })
    .eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (resync) {
    const allAtThisTime = await matchingSessions(day, start_time, '', true)
    const toUpdate = allAtThisTime.filter(s => s.title === class_name)
    const toCancel = allAtThisTime.filter(s => s.title !== class_name)
    const correctServiceId = await getOrCreateServiceId(class_name)
    for (const s of toUpdate) {
      await supabase.from('sessions').update({
        instructor_name: instructor,
        ...(correctServiceId ? { service_id: correctServiceId } : {}),
      }).eq('id', s.id)
    }
    if (toCancel.length > 0) {
      await supabase.from('sessions').update({ status: 'CANCELLED' }).in('id', toCancel.map(s => s.id))
    }
    await seedSessions(day, start_time, end_time, class_name, instructor ?? '')
    revalidatePath('/classes')
    revalidatePath('/admin/schedule')
    revalidatePath('/admin/checkin')
    revalidatePath('/app/schedule')
    return NextResponse.json({ row: data, resynced: allAtThisTime.length, cancelled: toCancel.length })
  }

  const timeChanged = start_time !== old_start_time || end_time !== old_end_time
  const nameChanged = class_name !== (old_class_name ?? class_name)

  // When time changes, search by slot (day+time) not by title — session titles can drift
  // out of sync with the template, causing a title-based lookup to miss them entirely.
  let sessions = timeChanged
    ? await matchingSessions(old_day ?? day, old_start_time ?? start_time, '', true)
    : await matchingSessions(old_day ?? day, old_start_time ?? start_time, old_class_name ?? class_name)
  if (!timeChanged && sessions.length === 0) {
    sessions = await matchingSessions(old_day ?? day, old_start_time ?? start_time, '', true)
  }

  let newServiceId: string | undefined
  if (nameChanged) {
    newServiceId = await getOrCreateServiceId(class_name)
  }

  for (const s of sessions) {
    const update: Record<string, unknown> = { instructor_name: instructor }
    if (nameChanged) {
      update.title = class_name
      if (newServiceId) update.service_id = newServiceId
    }
    if (timeChanged) {
      const melbDate = getMelbDate(new Date(s.start_time))
      update.start_time = melbToUtc(melbDate, start_time)
      update.end_time   = melbToUtc(melbDate, end_time)
    }
    await supabase.from('sessions').update(update).eq('id', s.id)
  }

  await seedSessions(day, start_time, end_time, class_name, instructor ?? '')
  revalidatePath('/classes')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/checkin')
  revalidatePath('/app/schedule')

  return NextResponse.json({ row: data, updated: sessions.length })
}

// ── DELETE — remove a slot and cancel future sessions ────────────────────────

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, day, start_time, class_name } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getClient()
  const { error } = await supabase.from('schedule_template').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sessions = await matchingSessions(day, start_time, class_name)
  if (sessions.length > 0) {
    await supabase.from('sessions').update({ status: 'CANCELLED' }).in('id', sessions.map(s => s.id))
  }
  revalidatePath('/classes')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/checkin')
  revalidatePath('/app/schedule')

  return NextResponse.json({ cancelled: sessions.length })
}
