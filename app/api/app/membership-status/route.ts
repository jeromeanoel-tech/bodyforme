import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

// Prepaid plan keywords — these have a fixed end date and don't auto-renew.
// Weekly/monthly subscription plans are NOT in this list so BECS settlement
// delays (2–3 days after period end) don't incorrectly expire them.
const PREPAID_KEYWORDS = ['7-day', '3 month unlimited', '6 month unlimited', '1 year unlimited']

function isPrepaidExpired(plan: string, endDate: string | null): boolean {
  if (!endDate) return false
  const p = plan.toLowerCase()
  const isPrepaid = PREPAID_KEYWORDS.some(k => p.includes(k))
  if (!isPrepaid) return false
  return new Date(endDate) < new Date()
}

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabase
    .from('members')
    .select('plan_override, credit_balance, next_billing_date, end_date, status')
    .eq('id', session.id)
    .single()

  if (!data) return NextResponse.json({ plan: null, creditBalance: 0, nextBillingDate: null, membershipEndDate: null, status: 'inactive' })

  const plan   = data.plan_override ?? ''
  const endDate = data.end_date ?? null

  // Compute effective status — don't trust stale DB value for prepaid plans
  let effectiveStatus = data.status ?? 'inactive'

  if (effectiveStatus === 'active' && isPrepaidExpired(plan, endDate)) {
    effectiveStatus = 'inactive'
  }

  return NextResponse.json({
    plan:              plan || null,
    creditBalance:     Number(data.credit_balance ?? 0),
    nextBillingDate:   data.next_billing_date ?? null,
    membershipEndDate: endDate,
    status:            effectiveStatus,
  })
}
