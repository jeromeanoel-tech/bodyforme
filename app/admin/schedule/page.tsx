import { getSessions, getServices, getStaff, getScheduleTemplate } from '@/lib/db'
import ScheduleClient from './ScheduleClient'

function getInstructors(): string[] {
  try {
    const all = JSON.parse(process.env.ADMIN_CREDENTIALS ?? '[]') as { name: string }[]
    return all.map(u => u.name).filter(Boolean).sort()
  } catch { return [] }
}

export const dynamic = 'force-dynamic'

// Convert a Melbourne calendar date string (YYYY-MM-DD) + HH:MM to a UTC ISO string.
// Uses a 02:00 UTC probe to detect the Melbourne offset (AEST=+10, AEDT=+11).
function melbToUtcISO(melbDate: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const probe  = new Date(`${melbDate}T02:00:00Z`)
  const melbH  = parseInt(
    new Intl.DateTimeFormat('en-AU', { timeZone: 'Australia/Melbourne', hour: '2-digit', hour12: false }).format(probe), 10,
  )
  const offset = melbH - 2   // 10 for AEST, 11 for AEDT
  const utcH   = h - offset
  if (utcH >= 0) return `${melbDate}T${String(utcH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`
  const prev = new Date(`${melbDate}T00:00:00Z`)
  prev.setUTCDate(prev.getUTCDate() - 1)
  return `${prev.toISOString().slice(0, 10)}T${String(24 + utcH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`
}

function weekRange(offsetWeeks = 0) {
  const melbStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
  const [y, m, d] = melbStr.split('-').map(Number)
  const now = new Date(y, m - 1, d)
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offsetWeeks * 7)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const monStr = mon.toISOString().slice(0, 10)
  const sunStr = sun.toISOString().slice(0, 10)
  // Use proper UTC equivalents of Melbourne midnight and end-of-day so that
  // pre-10am classes (stored as previous UTC day) are included in the query.
  return {
    from:   melbToUtcISO(monStr, '00:00'),
    to:     melbToUtcISO(sunStr, '23:59'),
    monday: mon,
  }
}

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: { week?: string }
}) {
  const offset = parseInt(searchParams.week ?? '0', 10) || 0
  const { from, to, monday } = weekRange(offset)

  const [sessions, services, staff, template] = await Promise.all([
    getSessions(from, to),
    getServices(),
    getStaff(),
    getScheduleTemplate(),
  ])

  const scheduleToService  = Object.fromEntries(services.map(s => [s.scheduleId, s]))
  const resourceToStaff    = Object.fromEntries(staff.map(s => [s.resourceId, s]))
  const templateNameBySlot = Object.fromEntries(template.map(r => [`${r.day}:${r.start}`, r.className]))

  return (
    <ScheduleClient
      initialSessions={sessions}
      scheduleToService={scheduleToService}
      resourceToStaff={resourceToStaff}
      initialWeekOffset={offset}
      instructors={getInstructors()}
      templateNameBySlot={templateNameBySlot}
    />
  )
}
