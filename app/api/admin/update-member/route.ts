import { NextRequest, NextResponse } from 'next/server'
import { getMemberByContactId, updateMemberCredential, upsertMembership } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json() as {
    contactId:        string
    email?:           string
    phone?:           string
    status?:          string
    planOverride?:    string
    nextBillingDate?: string
    creditBalance?:   number
    adminNotes?:      string
  }

  const { contactId, ...patch } = body
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 })

  const member = await getMemberByContactId(contactId)
  if (!member) return NextResponse.json({ error: 'No member record found for this contact' }, { status: 404 })

  await updateMemberCredential(member._id, patch)

  // Keep memberships table in sync when plan or status is changed manually
  if (patch.planOverride !== undefined || patch.status !== undefined) {
    const newPlan   = patch.planOverride ?? member.planOverride
    const newStatus = patch.status       ?? member.status
    await upsertMembership({
      memberId:  member._id,
      planName:  newPlan,
      status:    newStatus === 'active' ? 'ACTIVE' : newStatus === 'inactive' ? 'CANCELED' : 'ACTIVE',
      startDate: '',
      endDate:   '',
    })
  }

  return NextResponse.json({ ok: true })
}
