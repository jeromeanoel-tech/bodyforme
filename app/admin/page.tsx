import { getContacts, getMemberships, getSessions, getServices } from '@/lib/wix'
import DashboardClient from './DashboardClient'

export const revalidate = 60

export default async function AdminDashboardPage() {
  const now  = new Date()
  const from = now.toISOString().slice(0, 10) + 'T00:00:00'
  const to   = now.toISOString().slice(0, 10) + 'T23:59:59'

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
