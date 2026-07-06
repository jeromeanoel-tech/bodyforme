import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/adminSession'
import { getMemberByStripeCustomerId, getMemberByEmail, updateMemberCredential, upsertMembership } from '@/lib/db'

export const maxDuration = 60

const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim(),
  { apiVersion: '2024-04-10' as never },
)

type FixResult = {
  subscriptionId: string
  customerId:     string
  memberEmail?:   string
  action:         'activated' | 'retried' | 'no_member' | 'no_invoice' | 'skipped' | 'error'
  detail?:        string
}

export async function POST() {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const results: FixResult[] = []

  // Fetch all incomplete subscriptions (these are ones where the first invoice
  // hasn't confirmed yet — common with BECS which takes 2-3 days to clear)
  let page = await stripe.subscriptions.list({
    status: 'incomplete',
    limit:  100,
    expand: ['data.latest_invoice.payment_intent'],
  })

  while (true) {
    for (const sub of page.data) {
      const result = await fixSubscription(sub)
      results.push(result)
    }
    if (!page.has_more) break
    page = await stripe.subscriptions.list({
      status:          'incomplete',
      limit:           100,
      starting_after:  page.data[page.data.length - 1].id,
      expand:          ['data.latest_invoice.payment_intent'],
    })
  }

  return NextResponse.json({
    activated: results.filter(r => r.action === 'activated').length,
    retried:   results.filter(r => r.action === 'retried').length,
    skipped:   results.filter(r => r.action === 'skipped').length,
    noMember:  results.filter(r => r.action === 'no_member').length,
    errors:    results.filter(r => r.action === 'error').length,
    results,
  })
}

async function fixSubscription(sub: Stripe.Subscription): Promise<FixResult> {
  const subscriptionId = sub.id
  const customerId     = sub.customer as string

  // Find the member
  let member = await getMemberByStripeCustomerId(customerId)
  if (!member) {
    try {
      const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
      const email = customer.email?.toLowerCase().trim()
      if (email) {
        member = await getMemberByEmail(email)
        if (member) {
          await updateMemberCredential(member._id, { stripeCustomerId: customerId })
        }
      }
    } catch { /* ignore */ }
  }

  if (!member) {
    return { subscriptionId, customerId, action: 'no_member' }
  }

  // Get the latest invoice and its payment intent
  const invoice = sub.latest_invoice as (Stripe.Invoice & { payment_intent: Stripe.PaymentIntent | null }) | null
  if (!invoice) {
    return { subscriptionId, customerId, memberEmail: member.email, action: 'no_invoice' }
  }

  const pi = invoice.payment_intent
  const piStatus = pi?.status ?? 'unknown'

  try {
    const periodEnd = sub.current_period_end
    const endDate   = periodEnd ? new Date(periodEnd * 1000).toISOString().slice(0, 10) : undefined
    const planName  = member.planOverride ?? ''

    if (piStatus === 'processing') {
      // BECS debit is in flight — bank confirmation takes 2-3 days.
      // Mark the member active now; invoice.paid webhook will fire when it clears.
      await updateMemberCredential(member._id, {
        status: 'active',
        ...(endDate ? { membershipEndDate: endDate, nextBillingDate: endDate } : {}),
      })
      await upsertMembership({
        memberId:  member._id,
        planName,
        status:    'ACTIVE',
        startDate: sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        endDate: endDate ?? '',
      })
      return { subscriptionId, customerId, memberEmail: member.email, action: 'activated', detail: 'BECS processing — member marked active' }
    }

    if (piStatus === 'requires_payment_method' || piStatus === 'requires_confirmation' || piStatus === 'requires_action') {
      // Payment method failed or needs action — retry the invoice charge
      // using the customer's default payment method
      const defaultPm = (sub.default_payment_method as string | null)
        ?? ((await stripe.customers.retrieve(customerId) as Stripe.Customer).invoice_settings?.default_payment_method as string | null)

      if (!defaultPm) {
        return { subscriptionId, customerId, memberEmail: member.email, action: 'skipped', detail: `payment_intent ${piStatus} — no default payment method to retry with` }
      }

      await stripe.invoices.pay(invoice.id, { payment_method: defaultPm })

      await updateMemberCredential(member._id, {
        status: 'active',
        ...(endDate ? { membershipEndDate: endDate, nextBillingDate: endDate } : {}),
      })
      await upsertMembership({
        memberId:  member._id,
        planName,
        status:    'ACTIVE',
        startDate: sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString().slice(0, 10)
          : new Date().toISOString().slice(0, 10),
        endDate: endDate ?? '',
      })
      return { subscriptionId, customerId, memberEmail: member.email, action: 'retried', detail: `retried invoice with payment method ${defaultPm}` }
    }

    // Any other state (succeeded, canceled, etc.) — nothing to do
    return { subscriptionId, customerId, memberEmail: member.email, action: 'skipped', detail: `payment_intent status: ${piStatus}` }

  } catch (err) {
    return { subscriptionId, customerId, memberEmail: member.email, action: 'error', detail: String(err) }
  }
}
