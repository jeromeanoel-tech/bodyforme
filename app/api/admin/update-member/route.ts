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
    contactId:        string
    email?:           string
    phone?:           string
    status?:          string
    planOverride?:    string
    nextBillingDate?: string
    creditBalance?:   number
    adminNotes?:      string
    paidTerm?:        string
  }

  const { contactId, ...patch } = body
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 })

  const member = await getMemberByContactId(contactId)
  if (!member) return NextResponse.json({ error: 'No member record found for this contact' }, { status: 404 })

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
