import { NextRequest, NextResponse } from 'next/server'
import { getMemberByContactId, updateMemberCredential, upsertMembership, CREDIT_PLANS } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

// Plans that are class packs or casual drop-ins — not recurring memberships.
// These should NOT create a membership row; credits tracked via creditBalance instead.
function isPackPlan(plan: string): boolean {
  if (!plan) return false
  return CREDIT_PLANS.some(p => plan.toLowerCase().includes(p.toLowerCase()))
}

export async function PATCH(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json() as {
    contactId:           string
    email?:              string
    phone?:              string
    status?:             string
    planOverride?:       string
    nextBillingDate?:    string
    membershipEndDate?:  string
    creditBalance?:      number
    adminNotes?:         string
    paidTerm?:           string
  }

  const { contactId, ...patch } = body
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 })

  const VALID_STATUSES = ['active', 'inactive', 'paused', 'past_due', 'pending']
  if (patch.status !== undefined && !VALID_STATUSES.includes(patch.status)) {
    return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 })
  }
  if (typeof patch.creditBalance === 'number' && patch.creditBalance < 0) {
    return NextResponse.json({ error: 'creditBalance cannot be negative' }, { status: 400 })
  }

  const member = await getMemberByContactId(contactId)
  if (!member) return NextResponse.json({ error: 'No member record found for this contact' }, { status: 404 })

  // When admin activates a member and no new expiry is supplied, clear any stale end_date
  // so booking is not blocked by a past expiry from a previous membership period.
  if (patch.status === 'active' && patch.membershipEndDate === undefined) {
    const existingEnd = member.membershipEndDate
    if (existingEnd) {
      const endDate = new Date(existingEnd); endDate.setHours(0, 0, 0, 0)
      const today   = new Date();            today.setHours(0, 0, 0, 0)
      if (today > endDate) patch.membershipEndDate = ''
    }
  }

  // If email is changing, verify it's not already used by another member
  if (patch.email && patch.email.toLowerCase() !== member.email.toLowerCase()) {
    const { getMemberByEmail } = await import('@/lib/db')
    const conflict = await getMemberByEmail(patch.email.toLowerCase())
    if (conflict && conflict._id !== member._id) {
      return NextResponse.json({ error: 'That email address is already used by another member' }, { status: 409 })
    }
  }

  await updateMemberCredential(member._id, patch)

  // Sync memberships table when plan or status changes
  if (patch.planOverride !== undefined || patch.status !== undefined) {
    const newPlan   = patch.planOverride ?? member.planOverride
    const newStatus = patch.status       ?? member.status
    const today     = new Date().toISOString().slice(0, 10)

    if (isPackPlan(newPlan)) {
      // Pack / casual — mark any existing membership as ended, don't create a new row.
      // The pack is tracked entirely via planOverride + creditBalance.
      await supabase
        .from('memberships')
        .update({ status: 'ENDED', end_date: today })
        .eq('member_id', member._id)
        .neq('status', 'ENDED')
    } else if (newPlan) {
      // Recurring membership — upsert a membership row
      await upsertMembership({
        memberId:  member._id,
        planName:  newPlan,
        status:    newStatus === 'active' ? 'ACTIVE' : newStatus === 'inactive' ? 'CANCELED' : 'ACTIVE',
        startDate: today,
        endDate:   '',
      })
    }
  }

  return NextResponse.json({ ok: true })
}
