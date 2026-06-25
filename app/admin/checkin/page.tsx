import { getSessions, getServices, getScheduleTemplate } from '@/lib/db'
import CheckInClient from './CheckInClient'

export const dynamic = 'force-dynamic'

export default async function AdminCheckInPage({ searchParams }: { searchParams: { session?: string } }) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
  // Use Melbourne-aware bounds: +11 for from (earliest possible Melbourne midnight in UTC, covers both AEST/AEDT)
  // and +10 for to (latest possible Melbourne end-of-day in UTC). This ensures morning sessions
  // stored as the previous UTC day are still included.
  const from  = new Date(`${today}T00:00:00+11:00`).toISOString()
  const to    = new Date(`${today}T23:59:59+10:00`).toISOString()

  const [sessions, services, template] = await Promise.all([
    getSessions(from, to),
    getServices(),
    getScheduleTemplate(),
  ])

  const templateNameBySlot = Object.fromEntries(template.map(r => [`${r.day}:${r.start}`, r.className]))

  const todaySessions = sessions
    .filter(s => s.status !== 'CANCELLED')
    .sort((a, b) => a.start.localeCompare(b.start))

  return <CheckInClient sessions={todaySessions} services={services} defaultSessionId={searchParams.session} templateNameBySlot={templateNameBySlot} />
}
