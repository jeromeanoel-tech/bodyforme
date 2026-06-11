import { NextRequest, NextResponse } from 'next/server'
import { getMemberByContactId, updateMemberCredential } from '@/lib/db'
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
  return NextResponse.json({ ok: true })
}
