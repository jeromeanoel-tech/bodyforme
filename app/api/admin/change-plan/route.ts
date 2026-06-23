import { NextRequest, NextResponse } from 'next/server'
import { getMemberById, updateMemberCredential, upsertMembership } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'
import { signupPlans } from '@/lib/content'

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { memberId, newPlanKey } = await req.json() as { memberId: string; newPlanKey: string }

    if (!memberId || !newPlanKey) {
      return NextResponse.json({ error: 'memberId and newPlanKey are required' }, { status: 400 })
    }

    const newPlan = signupPlans[newPlanKey]
    if (!newPlan || newPlan.mode !== 'subscription') {
      return NextResponse.json({ error: 'Invalid plan — must be a subscription plan' }, { status: 400 })
    }

    const member = await getMemberById(memberId)
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (!member.stripeCustomerId) return NextResponse.json({ error: 'No Stripe customer on this member' }, { status: 400 })

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

    const item = sub.items.data[0]
    if (!item) return NextResponse.json({ error: 'No subscription items found' }, { status: 400 })

    // Create a new Price with an inline product — this is the required path for subscription
    // item updates (price_data in subscriptions.update requires an existing product ID,
    // so we pre-create the price via prices.create which supports product_data inline).
    const price = await stripe.prices.create({
      currency:     'aud',
      unit_amount:  newPlan.amount,
      product_data: { name: newPlan.name },
      recurring:    { interval: newPlan.billingInterval ?? 'week' },
    })

    // Update the subscription item to use the new price — no cancel+recreate needed
    await stripe.subscriptions.update(sub.id, {
      items: [{ id: item.id, price: price.id }],
      proration_behavior: 'none',
      metadata:           { planKey: newPlanKey },
    })

    const today = new Date().toISOString().slice(0, 10)

    // Update DB immediately — webhook will also sync but this keeps admin view fresh
    await updateMemberCredential(member._id, { planOverride: newPlan.name })
    await upsertMembership({
      memberId:  member._id,
      planName:  newPlan.name,
      status:    'ACTIVE',
      startDate: today,
      endDate:   member.membershipEndDate ?? '',
    })

    return NextResponse.json({ ok: true, newPlanName: newPlan.name })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[change-plan] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
