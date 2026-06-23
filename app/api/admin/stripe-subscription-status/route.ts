import { NextRequest, NextResponse } from 'next/server'
import { getMemberById } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const memberId = req.nextUrl.searchParams.get('memberId')
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

    const member = await getMemberById(memberId)
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    if (!member.stripeCustomerId) {
      return NextResponse.json({ subscription: null, paymentMethod: null })
    }

    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim()
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

    const customerId = member.stripeCustomerId

    // Get all subscriptions, prefer active > past_due > trialing > most recent
    const { data: subs } = await stripe.subscriptions.list({ customer: customerId, limit: 5 })

    const sub =
      subs.find(s => s.status === 'active') ??
      subs.find(s => s.status === 'past_due') ??
      subs.find(s => s.status === 'trialing') ??
      subs[0] ??
      null

    // Resolve the payment method ID
    let pmId: string | null = null
    if (sub?.default_payment_method) {
      pmId = typeof sub.default_payment_method === 'string'
        ? sub.default_payment_method
        : (sub.default_payment_method as { id: string }).id
    }
    if (!pmId) {
      const customer = await stripe.customers.retrieve(customerId)
      if (!('deleted' in customer)) {
        const def = customer.invoice_settings?.default_payment_method
        pmId = def
          ? typeof def === 'string' ? def : (def as { id: string }).id
          : null
      }
    }

    const pm = pmId ? await stripe.paymentMethods.retrieve(pmId) : null

    let paymentMethod = null
    if (pm) {
      if (pm.type === 'au_becs_debit' && pm.au_becs_debit) {
        paymentMethod = {
          id:   pm.id,
          type: 'au_becs_debit' as const,
          bsb:  pm.au_becs_debit.bsb_number ?? '',
          last4: pm.au_becs_debit.last4 ?? '',
        }
      } else if (pm.type === 'card' && pm.card) {
        paymentMethod = {
          id:    pm.id,
          type:  'card' as const,
          brand: pm.card.brand ?? '',
          last4: pm.card.last4 ?? '',
        }
      } else {
        paymentMethod = { id: pm.id, type: 'other' as const }
      }
    }

    let subscription = null
    if (sub) {
      const item     = sub.items.data[0]
      const price    = item?.price
      const amount   = price?.unit_amount ?? 0
      const interval = (price?.recurring as { interval?: string } | null)?.interval ?? 'week'

      // Resolve plan name: price nickname → product name
      let planName = price?.nickname ?? ''
      if (!planName && price?.product) {
        try {
          const prod = await stripe.products.retrieve(
            typeof price.product === 'string' ? price.product : (price.product as { id: string }).id
          )
          planName = prod.name ?? ''
        } catch { /* keep empty */ }
      }
      if (!planName) planName = member.planOverride ?? ''

      subscription = {
        id:               sub.id,
        status:           sub.status,
        planName,
        amount,
        interval,
        currentPeriodEnd: (sub as unknown as { current_period_end: number }).current_period_end ?? 0,
      }
    }

    return NextResponse.json({ subscription, paymentMethod })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[stripe-subscription-status]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
