import { getSessions, getServices } from '@/lib/wix'
import CheckInClient from './CheckInClient'

export const revalidate = 30

export default async function AdminCheckInPage() {
  const now  = new Date()
  const from = now.toISOString().slice(0, 10) + 'T00:00:00'
  const to   = now.toISOString().slice(0, 10) + 'T23:59:59'

  const [sessions, services] = await Promise.all([
    getSessions(from, to),
    getServices(),
  ])

  const todaySessions = sessions
    .filter(s => s.status !== 'CANCELLED')
    .sort((a, b) => a.start.localeCompare(b.start))

  return <CheckInClient sessions={todaySessions} services={services} />
}
