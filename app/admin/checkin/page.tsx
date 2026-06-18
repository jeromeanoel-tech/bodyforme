import { getSessions, getServices } from '@/lib/db'
import CheckInClient from './CheckInClient'

export const dynamic = 'force-dynamic'

export default async function AdminCheckInPage() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
  const from  = today + 'T00:00:00'
  const to    = today + 'T23:59:59'

  const [sessions, services] = await Promise.all([
    getSessions(from, to),
    getServices(),
  ])

  const todaySessions = sessions
    .filter(s => s.status !== 'CANCELLED')
    .sort((a, b) => a.start.localeCompare(b.start))

  return <CheckInClient sessions={todaySessions} services={services} />
}
