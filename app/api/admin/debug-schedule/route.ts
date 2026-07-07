import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
)

function getMelbDate(d: Date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(d)
}

function getMelbWeekday(d: Date) {
  return new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'long' })
    .format(d).toLowerCase()
}

function getMelbTime(d: Date) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(d)
}

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const now = new Date()
  const melbNow = getMelbDate(now)
  const melbWeekday = getMelbWeekday(now)

  // --- Compute the exact same query window the Schedule page uses ---
  // This mirrors ScheduleClient weekRange(0) as run by the server page.tsx
  const melbStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
  const [y, m, d] = melbStr.split('-').map(Number)
  const melbMidnight = new Date(y, m - 1, d)
  const mon = new Date(melbMidnight)
  mon.setDate(melbMidnight.getDate() - ((melbMidnight.getDay() + 6) % 7))
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 0)
  const pad = (dt: Date) => dt.toISOString().slice(0, 10)
  const queryFrom = `${pad(mon)}T00:00:00`
  const queryTo   = `${pad(sun)}T23:59:59`

  // --- Fetch every session in a ±2-week window so we can see what actually exists ---
  const wideFrom = new Date(mon)
  wideFrom.setDate(mon.getDate() - 7)
  const wideTo = new Date(sun)
  wideTo.setDate(sun.getDate() + 7)

  const { data: allSessions } = await supabase
    .from('sessions')
    .select('id, title, start_time, end_time, status, service_id, capacity')
    .gte('start_time', wideFrom.toISOString())
    .lte('start_time', wideTo.toISOString())
    .order('start_time')

  // --- What sessions fall inside the schedule page's query window? ---
  const inWindow = (allSessions ?? []).filter(s => {
    return s.start_time >= queryFrom && s.start_time <= queryTo + 'Z'
  })

  // --- Get template rows ---
  const { data: template } = await supabase
    .from('schedule_template')
    .select('id, day, start_time, class_name, instructor')
    .order('day').order('start_time')

  // --- For each Monday template row, check if a session exists this week ---
  const mondayRows = (template ?? []).filter(r => r.day === 'monday')
  const mondayReport = mondayRows.map(r => {
    // What UTC timestamps should this Monday class produce?
    const mondayMelb = pad(mon)  // e.g. '2026-07-06'
    const [h, mi] = r.start_time.split(':').map(Number)
    // probe the UTC offset for that Melbourne date
    const probe = new Date(`${mondayMelb}T02:00:00Z`)
    const offsetH = parseInt(
      new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', hour12: false }).format(probe), 10
    ) - 2
    const utcH = h - offsetH
    let expectedUTC: string
    if (utcH >= 0) {
      expectedUTC = `${mondayMelb}T${String(utcH).padStart(2,'0')}:${String(mi).padStart(2,'0')}:00.000Z`
    } else {
      const prev = pad(new Date(Date.UTC(
        parseInt(mondayMelb.slice(0,4)),
        parseInt(mondayMelb.slice(5,7)) - 1,
        parseInt(mondayMelb.slice(8,10)) - 1,
      )))
      expectedUTC = `${prev}T${String(24+utcH).padStart(2,'0')}:${String(mi).padStart(2,'0')}:00.000Z`
    }

    const sessionExists = (allSessions ?? []).find(s =>
      s.start_time === expectedUTC && s.status !== 'CANCELLED'
    )
    const inQueryWindow = sessionExists
      ? (sessionExists.start_time >= queryFrom && sessionExists.start_time <= queryTo + 'Z')
      : false

    return {
      class_name:    r.class_name,
      template_time: r.start_time,
      expected_utc:  expectedUTC,
      session_exists: !!sessionExists,
      session_id:    sessionExists?.id ?? null,
      session_status: sessionExists?.status ?? null,
      in_query_window: inQueryWindow,
    }
  })

  return NextResponse.json({
    server_utc_now:   now.toISOString(),
    melb_now:         melbNow,
    melb_weekday:     melbWeekday,
    schedule_query:   { from: queryFrom, to: queryTo },
    this_week_monday: pad(mon),
    monday_template_rows: mondayReport,
    sessions_in_window: inWindow.map(s => ({
      id:         s.id,
      title:      s.title,
      start_utc:  s.start_time,
      melb_time:  getMelbTime(new Date(s.start_time)),
      status:     s.status,
    })),
    all_sessions_±2weeks: (allSessions ?? []).map(s => ({
      title:     s.title,
      start_utc: s.start_time,
      melb_time: getMelbTime(new Date(s.start_time)),
      status:    s.status,
    })),
  })
}
