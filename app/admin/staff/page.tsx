import { getStaff, getServices, getSessions } from '@/lib/wix'
import StaffClient from './StaffClient'

export const revalidate = 300

export default async function AdminStaffPage() {
  const now  = new Date()
  const mon  = new Date(now)
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6)

  const from = mon.toISOString().slice(0, 10) + 'T00:00:00'
  const to   = sun.toISOString().slice(0, 10) + 'T23:59:59'

  const [staff, services, sessions] = await Promise.all([
    getStaff(),
    getServices(),
    getSessions(from, to),
  ])

  return <StaffClient staff={staff} services={services} sessions={sessions} />
}
