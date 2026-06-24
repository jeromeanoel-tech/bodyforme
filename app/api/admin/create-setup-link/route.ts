import { NextRequest, NextResponse } from 'next/server'
import { getMemberById } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'
import { signupPlans } from '@/lib/content'

// Creates a Stripe-hosted link Suzanne can send to the member.
// mode=subscription → Checkout Session (member completes BECS setup + starts subscription)
// mode=portal       → Customer Portal (member updates their existing payment method)
export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { memberId, mode, planKey } = await req.json() as {
      memberId: string
      mode:     'subscription' | 'portal'
      planKey?: string
    }

    if (!memberId || !mode) {
      return NextResponse.json({ error: 'memberId and mode are required' }, { status: 400 })
    }

    const member = await getMemberById(memberId)
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    if (!member.email) return NextResponse.json({ error: 'Member has no email address' }, { status: 400 })

    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim()
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au').replace(/\\n|\n/g, '').trim()

    // Ensure Stripe customer exists
    let customerId = member.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    member.email,
        name:     `${member.firstName} ${member.lastName}`.trim(),
        metadata: { memberId: member._id },
      })
      customerId = customer.id
      const { updateMemberCredential } = await import('@/lib/db')
      await updateMemberCredential(member._id, { stripeCustomerId: customerId })
    }

    if (mode === 'portal') {
      // Customer Portal — member can update their payment method
      const portalSession = await stripe.billingPortal.sessions.create({
        customer:   customerId,
        return_url: `${baseUrl}/admin/clients`,
      })
      return NextResponse.json({ url: portalSession.url })
    }

    // subscription mode — Checkout Session for the member to complete BECS + start sub
    if (!planKey) return NextResponse.json({ error: 'planKey is required for subscription mode' }, { status: 400 })

    const plan = signupPlans[planKey]
    if (!plan || plan.mode !== 'subscription') {
      return NextResponse.json({ error: 'Invalid plan — must be a subscription plan' }, { status: 400 })
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer:              customerId,
      mode:                  'subscription',
      payment_method_types:  ['au_becs_debit'],
      line_items: [{
        price_data: {
          currency:     'aud',
          product_data: { name: plan.name },
          unit_amount:  plan.amount,
          recurring:    { interval: plan.billingInterval ?? 'week' },
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/admin/clients?setup=done`,
      cancel_url:  `${baseUrl}/admin/clients`,
      metadata: {
        plan:      planKey,
        memberId:  member._id,
        firstName: member.firstName,
        lastName:  member.lastName,
        source:    'member_app',  // treated as renewal → no welcome email in webhook
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[create-setup-link] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
