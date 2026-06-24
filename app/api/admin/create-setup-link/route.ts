import { NextRequest, NextResponse } from 'next/server'
import { getMemberById } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'
import { signupPlans } from '@/lib/content'
import { emailUpdatePaymentLink } from '@/lib/email'

// mode=subscription → Creates a subscription with send_invoice; Stripe emails the client directly
//                     with the plan pre-loaded and a "Pay Invoice" button (BECS + card).
//                     After first payment the webhook switches to charge_automatically.
// mode=portal       → Customer Portal link emailed via Resend (member updates existing payment method)
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
      await emailUpdatePaymentLink({ to: member.email, firstName: member.firstName, portalUrl: portalSession.url })
      return NextResponse.json({ sent: true })
    }

    // subscription mode — create subscription and let Stripe email the client directly
    if (!planKey) return NextResponse.json({ error: 'planKey is required for subscription mode' }, { status: 400 })

    const plan = signupPlans[planKey]
    if (!plan || plan.mode !== 'subscription') {
      return NextResponse.json({ error: 'Invalid plan — must be a subscription plan' }, { status: 400 })
    }

    // subscriptions.create price_data requires an existing product ID, not inline product_data.
    // Find the product by name; create it if it doesn't exist yet.
    const productList = await stripe.products.list({ active: true, limit: 100 })
    let product = productList.data.find(p => p.name === plan.name)
    if (!product) {
      product = await stripe.products.create({ name: plan.name })
    }

    // Stripe creates the invoice, finalises it, and emails the client automatically.
    // The hosted invoice page (invoice.stripe.com) shows the plan details and accepts
    // both BECS direct debit and card. After first payment the webhook switches
    // collection_method → charge_automatically so future billings are silent.
    await stripe.subscriptions.create({
      customer:           customerId,
      collection_method:  'send_invoice',
      days_until_due:     7,
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['au_becs_debit', 'card'],
      } as any,
      items: [{
        price_data: {
          currency:    'aud',
          product:     product.id,
          unit_amount: plan.amount,
          recurring:   { interval: plan.billingInterval ?? 'week' },
        } as any,
      }],
      metadata: {
        plan:      planKey,
        memberId:  member._id,
        firstName: member.firstName,
        lastName:  member.lastName,
        source:    'member_app',
      },
    })

    return NextResponse.json({ sent: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[create-setup-link] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
