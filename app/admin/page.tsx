import { getContacts, getMemberships, getSessions, getServices } from '@/lib/db'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  // Use Melbourne local date — Vercel runs in UTC, so new Date() would give yesterday before 10am AEST
  const todayMelbourne = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
  const from = todayMelbourne + 'T00:00:00'
  const to   = todayMelbourne + 'T23:59:59'

  const [sessions, memberships, contacts, services] = await Promise.all([
    getSessions(from, to),
    getMemberships(),
    getContacts(),
    getServices(),
  ])

  return (
    <DashboardClient
      sessions={sessions}
      memberships={memberships}
      contacts={contacts}
      services={services}
    />
  )
}
