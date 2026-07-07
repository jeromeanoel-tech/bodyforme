import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'
import { getMelbFirstOccurrence, melbToUtc } from '@/lib/dates'

export const maxDuration = 60

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
)

async function getOrCreateServiceId(className: string): Promise<string | undefined> {
  const { data: existing } = await supabase.from('services').select('id').eq('name', className).limit(1)
  if (existing?.[0]?.id) return existing[0].id
  const { data: created } = await supabase.from('services')
    .insert({ name: className, description: '', duration: 60, capacity: 20 })
    .select('id').single()
  return created?.id
}

async function sessionsAtSlot(day: string, startHHMM: string) {
  const { data } = await supabase.from('sessions')
    .select('id, title, start_time, end_time')
    .neq('status', 'CANCELLED')
    .gt('start_time', new Date().toISOString())

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

async function seedMissingSessions(
  day: string, startHHMM: string, endHHMM: string,
  className: string, instructor: string, serviceId: string,
) {
  // Use getMelbFirstOccurrence so week starts on Melbourne Monday regardless of server timezone
  const firstMelbDate = getMelbFirstOccurrence(day)
  const [fy, fm, fd]  = firstMelbDate.split('-').map(Number)

  const inserts: object[] = []
  for (let week = 0; week < 12; week++) {
    const melbDate = new Date(Date.UTC(fy, fm - 1, fd + week * 7)).toISOString().slice(0, 10)
    const startISO = melbToUtc(melbDate, startHHMM)
    const endISO   = melbToUtc(melbDate, endHHMM)

    // Check by Melbourne date+time window (±30s) rather than exact UTC string
    // so DST-edge or format-variation can't cause a false "missing" detection
    const windowStart = new Date(new Date(startISO).getTime() - 30_000).toISOString()
    const windowEnd   = new Date(new Date(startISO).getTime() + 30_000).toISOString()
    const { data: existing } = await supabase.from('sessions')
      .select('id, status')
      .eq('service_id', serviceId)
      .gte('start_time', windowStart)
      .lte('start_time', windowEnd)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'CANCELLED') {
        await supabase.from('sessions').update({ status: 'CONFIRMED', instructor_name: instructor, end_time: endISO, service_id: serviceId }).eq('id', existing.id)
      }
      continue
    }
    inserts.push({ service_id: serviceId, title: className, instructor_name: instructor, start_time: startISO, end_time: endISO, capacity: 20, status: 'CONFIRMED' })
  }
  if (inserts.length > 0) {
    const { error } = await supabase.from('sessions').insert(inserts)
    if (error) console.error('[seedMissingSessions] insert failed:', error.message)
  }
}

export async function POST() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: rows, error } = await supabase.from('schedule_template').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let totalFixed = 0
  let totalCancelled = 0

  for (const row of rows ?? []) {
    const serviceId = await getOrCreateServiceId(row.class_name)
    if (!serviceId) continue

    const allAtSlot = await sessionsAtSlot(row.day, row.start_time)
    const toUpdate  = allAtSlot.filter(s => s.title === row.class_name)
    const toCancel  = allAtSlot.filter(s => s.title !== row.class_name)

    // Update correct-title sessions: fix service_id and instructor
    for (const s of toUpdate) {
      await supabase.from('sessions').update({ service_id: serviceId, instructor_name: row.instructor }).eq('id', s.id)
      totalFixed++
    }
    // Cancel sessions at this slot with the wrong class name
    if (toCancel.length > 0) {
      await supabase.from('sessions').update({ status: 'CANCELLED' }).in('id', toCancel.map(s => s.id))
      totalCancelled += toCancel.length
    }
    // Seed any missing weeks
    await seedMissingSessions(row.day, row.start_time, row.end_time, row.class_name, row.instructor ?? '', serviceId)
  }

  return NextResponse.json({ ok: true, fixed: totalFixed, cancelled: totalCancelled })
}
