import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

// Strip timezone offset and reformat as ICS datetime: '2026-06-19T09:00:00' → '20260619T090000'
// Sessions are stored as Melbourne local time (naive UTC in Postgres), so no conversion needed.
function icsdt(iso: string): string {
  return iso.slice(0, 19).replace(/[-:]/g, '')
}

function addMinutes(icsTime: string, mins: number): string {
  // icsTime like '20260619T090000'
  const y  = parseInt(icsTime.slice(0, 4))
  const mo = parseInt(icsTime.slice(4, 6)) - 1
  const d  = parseInt(icsTime.slice(6, 8))
  const h  = parseInt(icsTime.slice(9, 11))
  const mi = parseInt(icsTime.slice(11, 13))
  const dt = new Date(y, mo, d, h, mi + mins)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ memberId: string }> },
) {
  const { memberId } = await params

  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (session.id !== memberId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: member } = await supabase
    .from('members')
    .select('id, first_name')
    .eq('id', memberId)
    .single()

  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Fetch upcoming confirmed bookings with session details
  const nowIso = new Date().toISOString().slice(0, 19)
  const { data: rows } = await supabase
    .from('bookings')
    .select('id, sessions(title, start_time, end_time, instructor_name)')
    .eq('member_id', memberId)
    .eq('status', 'CONFIRMED')
    .limit(200)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upcoming = (rows ?? []).filter((r: any) => (r.sessions?.start_time ?? '') >= nowIso)

  // Build ICS
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BodyForme//Classes//EN',
    'X-WR-CALNAME:BodyForme Classes',
    'X-WR-TIMEZONE:Australia/Melbourne',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const row of upcoming as any[]) {
    const s = row.sessions
    if (!s?.start_time) continue

    const dtStart = icsdt(s.start_time)
    const dtEnd   = s.end_time ? icsdt(s.end_time) : addMinutes(dtStart, 60)
    const desc    = s.instructor_name
      ? `Instructor: ${s.instructor_name}`
      : 'BodyForme Pilates Studio'

    lines.push(
      'BEGIN:VEVENT',
      `UID:booking-${row.id}@bodyforme.com.au`,
      `DTSTART;TZID=Australia/Melbourne:${dtStart}`,
      `DTEND;TZID=Australia/Melbourne:${dtEnd}`,
      `SUMMARY:${s.title ?? 'Pilates Class'}`,
      `DESCRIPTION:${desc}`,
      'LOCATION:BodyForme Pilates Studio\\, Doncaster VIC 3108',
      'STATUS:CONFIRMED',
      'END:VEVENT',
    )
  }

  lines.push('END:VCALENDAR')

  const download = req.nextUrl.searchParams.get('download') === '1'

  return new NextResponse(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      ...(download ? { 'Content-Disposition': 'attachment; filename="bodyforme-classes.ics"' } : {}),
    },
  })
}
