import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { getSessions, getMemberBookingsForRange, getMemberWaitlistInRange, getStaff } from '@/lib/db'
import type { Session } from '@/lib/db'
import ScheduleClient from './ScheduleClient'

export const dynamic = 'force-dynamic'

function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekRange(): { from: string; to: string } {
  const today = new Date()
  const day   = today.getDay()
  const mon   = new Date(today)
  mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
  mon.setHours(12, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  // Expand from by 1 day so Melbourne morning sessions (stored as previous UTC date) are included
  const fromExpanded = new Date(mon)
  fromExpanded.setDate(mon.getDate() - 1)
  return { from: localDate(fromExpanded), to: localDate(sun) }
}

export default async function SchedulePage() {
  const session = await getSession()
  if (!session) redirect('/app/login')

  const { from, to } = getWeekRange()

  const [sessions, bookings, waitlistIds, staff] = await Promise.all([
    getSessions(`${from}T00:00:00`, `${to}T23:59:59`),
    getMemberBookingsForRange(session.id, from, to),
    getMemberWaitlistInRange(session.id, from, to),
    getStaff(),
  ])

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
    />
  )
}
