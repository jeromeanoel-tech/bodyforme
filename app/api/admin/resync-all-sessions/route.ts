import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

export const maxDuration = 60

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
)

function getMelbDate(d: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(d)
}

function melbToUtc(melbDateStr: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const probe  = new Date(`${melbDateStr}T02:00:00Z`)
  const melbH  = parseInt(
    new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', hour12: false }).format(probe), 10,
  )
  const offsetH = melbH - 2
  const utcH    = h - offsetH
  if (utcH >= 0) {
    return `${melbDateStr}T${String(utcH).padStart(2,'0')}:${String(m).padStart(2,'0')}:00.000Z`
  }
  const prev = new Date(`${melbDateStr}T00:00:00Z`)
  prev.setUTCDate(prev.getUTCDate() - 1)
  return `${prev.toISOString().slice(0,10)}T${String(24+utcH).padStart(2,'0')}:${String(m).padStart(2,'0')}:00.000Z`
}

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
  const DOW = { sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6 }
  const targetDow = DOW[day as keyof typeof DOW]
  const todayMelb = getMelbDate()
  const todayDate = new Date(`${todayMelb}T12:00:00Z`)
  const daysUntil = (targetDow - todayDate.getUTCDay() + 7) % 7
  const first = new Date(todayDate)
  first.setUTCDate(first.getUTCDate() + daysUntil)

  const inserts: object[] = []
  for (let week = 0; week < 12; week++) {
    const d = new Date(first)
    d.setUTCDate(d.getUTCDate() + week * 7)
    const melbDate = d.toISOString().slice(0, 10)
    const startISO = melbToUtc(melbDate, startHHMM)
    const endISO   = melbToUtc(melbDate, endHHMM)

    const { data: existing } = await supabase.from('sessions')
      .select('id, status').eq('service_id', serviceId).eq('start_time', startISO).maybeSingle()

    if (existing) {
      if (existing.status === 'CANCELLED') {
        await supabase.from('sessions').update({ status: 'CONFIRMED', instructor_name: instructor, end_time: endISO, service_id: serviceId }).eq('id', existing.id)
      }
      continue
    }
    inserts.push({ service_id: serviceId, title: className, instructor_name: instructor, start_time: startISO, end_time: endISO, capacity: 20, status: 'CONFIRMED' })
  }
  if (inserts.length > 0) await supabase.from('sessions').insert(inserts)
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
