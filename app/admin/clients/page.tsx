import { getContacts, getMemberships } from '@/lib/wix'
import type { WixMembership } from '@/lib/wix'
import ClientsClient from './ClientsClient'

export const revalidate = 60

export default async function AdminClientsPage() {
  const [contacts, memberships] = await Promise.all([
    getContacts(),
    getMemberships(),
  ])

  // Group memberships by contactId
  const membershipsByContact: Record<string, WixMembership[]> = {}
  for (const m of memberships) {
    if (!m.contactId) continue
    if (!membershipsByContact[m.contactId]) membershipsByContact[m.contactId] = []
    membershipsByContact[m.contactId].push(m)
  }

  // Unique plan names for dynamic filter chips
  const planNames = memberships
    .map(m => m.planName)
    .filter(Boolean)
    .filter((n, i, arr) => arr.indexOf(n) === i)
    .sort()

  return (
    <ClientsClient
      contacts={contacts}
      membershipsByContact={membershipsByContact}
      planNames={planNames}
    />
  )
}
