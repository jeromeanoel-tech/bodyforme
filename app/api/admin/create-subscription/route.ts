import { NextRequest, NextResponse } from 'next/server'
import { getMemberByEmail, updateMemberCredential, upsertMembership } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'
import { signupPlans } from '@/lib/content'

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { email, planKey, paymentMethodId } = await req.json() as {
      email:           string
      planKey:         string
      paymentMethodId: string
    }

    if (!email || !planKey || !paymentMethodId) {
      return NextResponse.json({ error: 'email, planKey and paymentMethodId are required' }, { status: 400 })
    }

    const plan = signupPlans[planKey]
    if (!plan || plan.mode !== 'subscription') {
      return NextResponse.json({ error: 'Invalid plan — only subscription plans can use direct debit' }, { status: 400 })
    }

    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n/g, '').trim()
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

    const member = await getMemberByEmail(email.toLowerCase().trim())
    if (!member) return NextResponse.json({ error: 'No account found for that email.' }, { status: 404 })

    let customerId = member.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    member.email,
        name:     `${member.firstName} ${member.lastName}`.trim(),
        metadata: { memberId: member._id },
      })
      customerId = customer.id
      await updateMemberCredential(member._id, { stripeCustomerId: customerId })
    }

    // Set the BECS payment method as the customer's default
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })

    // Create the recurring subscription
    const subscription = await stripe.subscriptions.create({
      customer:                customerId,
      default_payment_method:  paymentMethodId,
      collection_method:       'charge_automatically',
      items: [{
        price_data: {
          currency:     'aud',
          unit_amount:  plan.amount,
          product_data: { name: plan.name },
          recurring:    { interval: plan.billingInterval ?? 'week' },
        },
      }],
      metadata: {
        planKey,
        memberId:  member._id,
        firstName: member.firstName,
        lastName:  member.lastName,
        source:    'admin_becs_setup',
      },
    })

    // Billing dates from the subscription's current period
    const periodEnd   = (subscription as unknown as { current_period_end: number }).current_period_end
    const nextBilling = periodEnd ? new Date(periodEnd * 1000).toISOString().slice(0, 10) : undefined
    const today       = new Date().toISOString().slice(0, 10)

    // Update member record — use human-readable plan.name, not planKey
    await updateMemberCredential(member._id, {
      planOverride: plan.name,
      status:       'active',
      ...(nextBilling ? { nextBillingDate: nextBilling, membershipEndDate: nextBilling } : {}),
    })

    // Sync memberships history table immediately (not waiting for invoice.paid)
    await upsertMembership({
      memberId:  member._id,
      planName:  plan.name,
      status:    'ACTIVE',
      startDate: today,
      endDate:   nextBilling ?? '',
    })

    return NextResponse.json({ subscriptionId: subscription.id, status: subscription.status })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[create-subscription] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
