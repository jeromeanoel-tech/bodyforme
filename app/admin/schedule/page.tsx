import { getSessions, getServices, getStaff, getScheduleTemplate, seedMissingWeekSessions } from '@/lib/db'
import { getScheduleWeekRange } from '@/lib/dates'
import ScheduleClient from './ScheduleClient'

function getInstructors(): string[] {
  try {
    const all = JSON.parse(process.env.ADMIN_CREDENTIALS ?? '[]') as { name: string }[]
    return all.map(u => u.name).filter(Boolean).sort()
  } catch { return [] }
}

export const dynamic = 'force-dynamic'

export default async function AdminSchedulePage({
  searchParams,
}: {
  searchParams: { week?: string }
}) {
  const offset = parseInt(searchParams.week ?? '0', 10) || 0
  const { from, to, melbMonday } = getScheduleWeekRange(offset)
  const monday = new Date(`${melbMonday}T12:00:00Z`)

  let [sessions, services, staff, template] = await Promise.all([
    getSessions(from, to),
    getServices(),
    getStaff(),
    getScheduleTemplate(),
  ])

  // Auto-heal: create any sessions the template says should exist but don't yet
  if (template.length > 0) {
    await seedMissingWeekSessions(template, sessions, melbMonday)
    sessions = await getSessions(from, to)
  }

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
