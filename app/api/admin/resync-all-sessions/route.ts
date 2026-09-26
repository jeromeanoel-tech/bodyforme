import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'
import { getMelbDate, getMelbDayTime, getMelbFirstOccurrence, melbToUtc } from '@/lib/dates'

export const maxDuration = 60

function getClient() {
  return createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
    (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
  )
}

async function getOrCreateServiceId(db: ReturnType<typeof getClient>, className: string): Promise<string | undefined> {
  const { data: existing } = await db.from('services').select('id').eq('name', className).limit(1)
  if (existing?.[0]?.id) return existing[0].id
  const { data: created } = await db.from('services')
    .insert({ name: className, description: '', duration: 60, capacity: 20 })
    .select('id').single()
  return created?.id
}

// Find all future non-cancelled sessions for a service on a specific Melbourne weekday.
// Uses service_id + day-of-week — finds sessions regardless of their current stored time,
// so a previously-failed time update cannot permanently hide sessions from this query.
async function sessionsOnDay(
  db: ReturnType<typeof getClient>,
  serviceId: string,
  day: string,
): Promise<Array<{ id: string; start_time: string; end_time: string; title: string }>> {
  const { data } = await db.from('sessions')
    .select('id, start_time, end_time, title')
    .eq('service_id', serviceId)
    .neq('status', 'CANCELLED')
    .gt('start_time', new Date().toISOString())
    .limit(5000)

  return (data ?? []).filter(s => getMelbDayTime(s.start_time).day === day)
}

async function seedMissingSessions(
  db: ReturnType<typeof getClient>,
  day: string, startHHMM: string, endHHMM: string,
  className: string, instructor: string, serviceId: string,
) {
  const firstMelbDate = getMelbFirstOccurrence(day)
  const [fy, fm, fd]  = firstMelbDate.split('-').map(Number)

  const inserts: object[] = []
  for (let week = 0; week < 12; week++) {
    const melbDate = new Date(Date.UTC(fy, fm - 1, fd + week * 7)).toISOString().slice(0, 10)
    const startISO = melbToUtc(melbDate, startHHMM)
    const endISO   = melbToUtc(melbDate, endHHMM)

    const { data: existing } = await db.from('sessions')
      .select('id, status')
      .eq('service_id', serviceId)
      .eq('start_time', startISO)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'CANCELLED') {
        await db.from('sessions').update({ status: 'CONFIRMED', instructor_name: instructor, end_time: endISO, service_id: serviceId }).eq('id', existing.id)
      }
      continue
    }

    inserts.push({ service_id: serviceId, title: className, instructor_name: instructor, start_time: startISO, end_time: endISO, capacity: 20, status: 'CONFIRMED' })
  }
  if (inserts.length > 0) {
    const { error } = await db.from('sessions').insert(inserts)
    if (error) console.error('[seedMissingSessions] insert failed:', error.message)
  }
}

export async function POST() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = getClient()
  const { data: rows, error } = await supabase.from('schedule_template').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let totalFixed = 0

  for (const row of rows ?? []) {
    const serviceId = await getOrCreateServiceId(supabase, row.class_name)
    if (!serviceId) continue

    // Find sessions for this class on this weekday, regardless of what time they're currently at.
    // If a time change previously failed to propagate, these sessions show up here and get fixed.
    const onThisDay = await sessionsOnDay(supabase, serviceId, row.day)

    for (const s of onThisDay) {
      const { time } = getMelbDayTime(s.start_time)
      if (time === row.start_time && s.title === row.class_name) continue  // already correct

      // Time or title has drifted — update in place to match the template
      const melbDate = getMelbDate(new Date(s.start_time))
      await supabase.from('sessions').update({
        title:           row.class_name,
        service_id:      serviceId,
        instructor_name: row.instructor ?? '',
        start_time:      melbToUtc(melbDate, row.start_time),
        end_time:        melbToUtc(melbDate, row.end_time),
      }).eq('id', s.id)
      totalFixed++
    }

    await seedMissingSessions(supabase, row.day, row.start_time, row.end_time, row.class_name, row.instructor ?? '', serviceId)
  }

  return NextResponse.json({ ok: true, fixed: totalFixed })
}
