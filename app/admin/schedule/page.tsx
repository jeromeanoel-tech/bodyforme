import { getSessions, getServices, getStaff } from '@/lib/db'
import ScheduleClient from './ScheduleClient'

export const revalidate = 30

function weekRange(offsetWeeks = 0) {
  // Use Melbourne date so the week is correct even before 10am (when UTC is still yesterday)
  const melbStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
  const [y, m, d] = melbStr.split('-').map(Number)
  const now = new Date(y, m - 1, d) // midnight UTC, but date is Melbourne's current date
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offsetWeeks * 7)
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 0)
  const pad = (d: Date) => d.toISOString().slice(0, 10)
  return { from: `${pad(mon)}T00:00:00`, to: `${pad(sun)}T23:59:59`, monday: mon }
}

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: { week?: string }
}) {
  const offset = parseInt(searchParams.week ?? '0', 10) || 0
  const { from, to, monday } = weekRange(offset)

  const [sessions, services, staff] = await Promise.all([
    getSessions(from, to),
    getServices(),
    getStaff(),
  ])

  const scheduleToService = Object.fromEntries(services.map(s => [s.scheduleId, s]))
  const resourceToStaff   = Object.fromEntries(staff.map(s => [s.resourceId, s]))

  return (
    <ScheduleClient
      initialSessions={sessions}
      scheduleToService={scheduleToService}
      resourceToStaff={resourceToStaff}
      initialWeekOffset={offset}
    />
  )
}
