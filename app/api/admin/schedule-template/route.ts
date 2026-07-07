import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
)

const DAY_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

/** Melbourne YYYY-MM-DD for a given Date */
function getMelbDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(d)
}

/** Convert Melbourne HH:MM on a Melbourne calendar date to a UTC ISO string */
function melbToUtc(melbDateStr: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const probe   = new Date(`${melbDateStr}T02:00:00Z`)
  const melbH   = parseInt(
    new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', hour12: false }).format(probe), 10,
  )
  const offsetH = melbH - 2   // 10 = AEST (winter), 11 = AEDT (summer)
  const utcH    = h - offsetH
  if (utcH >= 0) {
    return `${melbDateStr}T${String(utcH).padStart(2,'0')}:${String(m).padStart(2,'0')}:00.000Z`
  }
  const prev = new Date(`${melbDateStr}T00:00:00Z`)
  prev.setUTCDate(prev.getUTCDate() - 1)
  return `${prev.toISOString().slice(0,10)}T${String(24+utcH).padStart(2,'0')}:${String(m).padStart(2,'0')}:00.000Z`
}

/** Get or create a service record by class name, returning its id */
async function getOrCreateServiceId(className: string): Promise<string | undefined> {
  const { data: existing } = await supabase.from('services').select('id').eq('name', className).limit(1)
  if (existing?.[0]?.id) return existing[0].id
  const { data: created } = await supabase.from('services')
    .insert({ name: className, description: '', duration: 60, capacity: 20 })
    .select('id').single()
  return created?.id
}

/**
 * Find all future non-cancelled sessions matching a template slot.
 * When forceByTime=true, matches only on Melbourne weekday + start time (ignores class title).
 * This is used for resync, where the title in sessions may differ from the template.
 */
async function matchingSessions(day: string, startHHMM: string, className: string, forceByTime = false) {
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

/** Seed sessions for a template slot for the next 12 weeks */
async function seedSessions(day: string, startHHMM: string, endHHMM: string, className: string, instructor: string) {
  // Which PostgreSQL DOW does this day map to? (0=Sun,1=Mon,...,6=Sat)
  const DOW = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 }
  const targetDow = DOW[day as keyof typeof DOW]

  const todayMelb = getMelbDate()
  const todayDate = new Date(`${todayMelb}T12:00:00Z`)
  const todayDow  = todayDate.getUTCDay()
  const daysUntil = (targetDow - todayDow + 7) % 7
  const first     = new Date(todayDate)
  first.setUTCDate(first.getUTCDate() + daysUntil)

  const serviceId = await getOrCreateServiceId(className)
  if (!serviceId) return

  const inserts: object[] = []
  for (let week = 0; week < 12; week++) {
    const d = new Date(first)
    d.setUTCDate(d.getUTCDate() + week * 7)
    const melbDate = d.toISOString().slice(0, 10)
    const startISO = melbToUtc(melbDate, startHHMM)
    const endISO   = melbToUtc(melbDate, endHHMM)

    const { data: existing } = await supabase.from('sessions')
      .select('id, status').eq('service_id', serviceId).eq('start_time', startISO).neq('status', 'CANCELLED').maybeSingle()

    if (existing) {
      // Un-cancel sessions that were cancelled (e.g. after a template row was deleted)
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

// ── GET — return all template rows ───────────────────────────────────────────

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

  const { day, start_time, end_time, class_name, instructor } = await req.json()
  if (!day || !start_time || !end_time || !class_name) {
    return NextResponse.json({ error: 'day, start_time, end_time and class_name are required' }, { status: 400 })
  }

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
  const { id, day, start_time, end_time, class_name, instructor, resync } = body
  // "old_*" are the original values before the edit — used to find existing sessions
  const { old_day, old_start_time, old_end_time, old_class_name } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('schedule_template')
    .update({ day, start_time, end_time, class_name, instructor })
    .eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (resync) {
    // Find ALL future sessions at this day+time regardless of title
    const allAtThisTime = await matchingSessions(day, start_time, '', true)
    const toUpdate = allAtThisTime.filter(s => s.title === class_name)
    const toCancel = allAtThisTime.filter(s => s.title !== class_name)
    // Ensure the correct service_id for sessions with the right title
    const correctServiceId = await getOrCreateServiceId(class_name)
    for (const s of toUpdate) {
      await supabase.from('sessions').update({
        instructor_name: instructor,
        ...(correctServiceId ? { service_id: correctServiceId } : {}),
      }).eq('id', s.id)
    }
    // Cancel sessions with wrong class name at this time slot
    if (toCancel.length > 0) {
      await supabase.from('sessions').update({ status: 'CANCELLED' }).in('id', toCancel.map(s => s.id))
    }
    // Seed the correct class for any weeks that are now missing sessions
    await seedSessions(day, start_time, end_time, class_name, instructor ?? '')
    revalidatePath('/classes')
    revalidatePath('/admin/schedule')
    revalidatePath('/admin/checkin')
    revalidatePath('/app/schedule')
    return NextResponse.json({ row: data, resynced: allAtThisTime.length, cancelled: toCancel.length })
  }

  // Find sessions by title first; fall back to time-only match if none found
  // (handles cases where session titles drifted from the template class name)
  let sessions = await matchingSessions(old_day ?? day, old_start_time ?? start_time, old_class_name ?? class_name)
  if (sessions.length === 0) {
    sessions = await matchingSessions(old_day ?? day, old_start_time ?? start_time, '', true)
  }
  const timeChanged = start_time !== old_start_time || end_time !== old_end_time
  const nameChanged = class_name !== (old_class_name ?? class_name)

  // If class name changed, resolve the new service_id up front so all sessions are updated atomically
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

  // Ensure sessions exist for the next 12 weeks under the current class name
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
