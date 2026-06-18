import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import { getStaff, getServices, getSessions } from '@/lib/db'
import StaffClient from './StaffClient'

export const revalidate = 300

export default async function AdminStaffPage() {
  const session = await getAdminSession()
  if (session?.role !== 'admin') redirect('/admin')
  const melbStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Melbourne' })
  const [y, mo, dy] = melbStr.split('-').map(Number)
  const now  = new Date(y, mo - 1, dy)
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
