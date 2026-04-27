import { getMemberships, getContacts } from '@/lib/wix'
import MembershipsClient from './MembershipsClient'

export const revalidate = 60

export default async function AdminMembershipsPage() {
  const [memberships, contacts] = await Promise.all([
    getMemberships(),
    getContacts(),
  ])

  const contactMap = Object.fromEntries(
    contacts.map(c => [c.id, c])
  )

  const rows = memberships.map(m => ({
    ...m,
    clientName: contactMap[m.contactId]
      ? `${contactMap[m.contactId].firstName} ${contactMap[m.contactId].lastName}`.trim()
      : '—',
    email: contactMap[m.contactId]?.email ?? '',
    phone: contactMap[m.contactId]?.phone ?? '',
  }))

  return <MembershipsClient rows={rows} />
}
