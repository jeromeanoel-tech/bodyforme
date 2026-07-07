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

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Get all template rows
  const { data: rows, error } = await supabase
    .from('schedule_template')
    .select('id, day, start_time, end_time, class_name, instructor')
    .order('day').order('start_time')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Get all sessions in the next 14 days
  const now = new Date()
  const twoWeeksOut = new Date(now)
  twoWeeksOut.setDate(now.getDate() + 14)
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, title, start_time, status, service_id')
    .gte('start_time', now.toISOString())
    .lte('start_time', twoWeeksOut.toISOString())
    .neq('status', 'CANCELLED')
    .order('start_time')

  // For each template row, check what sessions exist
  const VALID_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  const report = (rows ?? []).map(r => {
    const dayNorm = (r.day ?? '').toLowerCase().trim()
    const dayValid = VALID_DAYS.includes(dayNorm)

    const matchingSessions = (sessions ?? []).filter(s => {
      const parts = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Melbourne',
        weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(new Date(s.start_time))
      const day = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? ''
      const h   = (parts.find(p => p.type === 'hour')?.value   ?? '0').padStart(2, '0')
      const mi  = (parts.find(p => p.type === 'minute')?.value ?? '0').padStart(2, '0')
      return day === dayNorm && `${h}:${mi}` === r.start_time
    })

    return {
      template_id:    r.id,
      day:            r.day,
      day_normalised: dayNorm,
      day_valid:      dayValid,
      start_time:     r.start_time,
      class_name:     r.class_name,
      sessions_found: matchingSessions.length,
      sessions:       matchingSessions.map(s => ({
        id:         s.id,
        title:      s.title,
        start_time: s.start_time,
        melb_time:  new Intl.DateTimeFormat('en-AU', {
          timeZone: 'Australia/Melbourne',
          weekday: 'short', day: 'numeric', month: 'short',
          hour: '2-digit', minute: '2-digit', hour12: true,
        }).format(new Date(s.start_time)),
        status:     s.status,
      })),
    }
  })

  const missing = report.filter(r => r.sessions_found === 0)
  const serverTime = getMelbDate()

  return NextResponse.json({
    server_melb_date: serverTime,
    total_template_rows: report.length,
    rows_with_no_sessions: missing.length,
    missing,
    all: report,
  })
}
