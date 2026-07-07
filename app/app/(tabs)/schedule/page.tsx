import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getSessions, getMemberBookingsForRange, getMemberWaitlistInRange, getStaff, getScheduleTemplate } from '@/lib/db'
import type { Session } from '@/lib/db'
import { getScheduleWeekRange } from '@/lib/dates'
import ScheduleClient from './ScheduleClient'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
  const session = await getSession()
  if (!session) redirect('/app/login')

  const { from, to, melbMonday, melbSunday } = getScheduleWeekRange(0)

  const [sessions, bookings, waitlistIds, staff, template] = await Promise.all([
    getSessions(from, to),
    getMemberBookingsForRange(session.id, melbMonday, melbSunday),
    getMemberWaitlistInRange(session.id, melbMonday, melbSunday),
    getStaff(),
    getScheduleTemplate(),
  ])

  const templateNameBySlot = Object.fromEntries(template.map(r => [`${r.day}:${r.start}`, r.className]))

  const initialBookedMap: Record<string, { bookingId: string }> = {}
  bookings
    .filter(b => b.status === 'CONFIRMED')
    .forEach(b => { initialBookedMap[b.sessionId] = { bookingId: b.bookingId } })

  const initialWaitlistMap: Record<string, true> = {}
  waitlistIds.forEach(id => { initialWaitlistMap[id] = true })

  const initialStaffMap: Record<string, string> = Object.fromEntries(
    staff.map(s => [s.resourceId, s.name])
  )

  return (
    <ScheduleClient
      initialSessions={sessions as Session[]}
      initialBookedMap={initialBookedMap}
      initialWaitlistMap={initialWaitlistMap}
      initialStaffMap={initialStaffMap}
      templateNameBySlot={templateNameBySlot}
    />
  )
}
