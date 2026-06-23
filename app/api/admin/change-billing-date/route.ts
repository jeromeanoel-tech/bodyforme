import { NextRequest, NextResponse } from 'next/server'
import { getMemberById, updateMemberCredential } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { memberId, newDate } = await req.json() as { memberId: string; newDate: string }

    if (!memberId || !newDate) {
      return NextResponse.json({ error: 'memberId and newDate (YYYY-MM-DD) are required' }, { status: 400 })
    }

    const member = await getMemberById(memberId)
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (!member.stripeCustomerId) return NextResponse.json({ error: 'No Stripe customer on this member' }, { status: 400 })

    const trialEndTs = Math.floor(new Date(newDate + 'T00:00:00Z').getTime() / 1000)
    if (trialEndTs <= Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ error: 'New billing date must be in the future' }, { status: 400 })
    }

    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n/g, '').trim()
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

    // Find active subscription
    const { data: subs } = await stripe.subscriptions.list({
      customer: member.stripeCustomerId,
      status:   'active',
      limit:    1,
    })

    const sub = subs[0]
    if (!sub) return NextResponse.json({ error: 'No active subscription found' }, { status: 404 })

    // trial_end pushes the next billing date. billing_cycle_anchor is updated to trial_end,
    // so billing resumes weekly from that date onwards. proration_behavior: 'none' means
    // no credit/charge for the skipped period.
    await stripe.subscriptions.update(sub.id, {
      trial_end:          trialEndTs,
      proration_behavior: 'none',
    })

    // Sync DB — subscription webhook will also fire but this keeps the admin view immediate
    await updateMemberCredential(member._id, {
      nextBillingDate:   newDate,
      membershipEndDate: newDate,
    })

    return NextResponse.json({ ok: true, nextBillingDate: newDate })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[change-billing-date] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
