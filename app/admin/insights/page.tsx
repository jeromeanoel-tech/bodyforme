import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import { getContacts, getMemberships, getSessions, getServices, getFreeTrialCount } from '@/lib/db'
import InsightsClient from './InsightsClient'

export const revalidate = 60

export default async function AdminInsightsPage() {
  const session = await getAdminSession()
  if (session?.role !== 'admin') redirect('/admin')
  // Fetch 90 days of sessions for trend data
  const todayMelb = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
  const [y, mo, dy] = todayMelb.split('-').map(Number)
  const now = new Date(y, mo - 1, dy)
  const from = new Date(now); from.setDate(now.getDate() - 90)
  const fromStr = from.toISOString().slice(0, 10) + 'T00:00:00'
  const toStr   = todayMelb + 'T23:59:59'

  const [contacts, memberships, sessions, services, freeTrialCount] = await Promise.all([
    getContacts(),
    getMemberships(),
    getSessions(fromStr, toStr),
    getServices(),
    getFreeTrialCount(),
  ])

  const scheduleToName = Object.fromEntries(services.map(s => [s.scheduleId, s.name]))

  return (
    <InsightsClient
      contacts={contacts.map(c => ({ id: c.id, createdDate: c.createdDate }))}
      memberships={memberships}
      freeTrialCount={freeTrialCount}
      sessions={sessions.map(s => ({
        id:         s.id,
        start:      s.start,
        bookedCount: s.bookedCount,
        capacity:   s.capacity,
        name:       scheduleToName[s.scheduleId] ?? s.title,
      }))}
    />
  )
}
