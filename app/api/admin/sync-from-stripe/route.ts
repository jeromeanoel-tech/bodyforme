import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/adminSession'
import { getMemberByStripeCustomerId, getMemberByEmail, updateMemberCredential, upsertMembership } from '@/lib/db'

export const maxDuration = 60

const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim(),
  { apiVersion: '2024-04-10' as never },
)

type SyncResult = {
  customerId:    string
  memberEmail?:  string
  matchedBy?:    'customer_id' | 'email'
  action:        'updated' | 'no_member' | 'error'
  detail?:       string
}

async function resolvePlanName(priceId: string, priceNickname: string | null): Promise<string> {
  if (priceNickname) return priceNickname
  if (!priceId) return ''
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] }) as Stripe.Price & { product: Stripe.Product }
    return price.nickname ?? (price.product as Stripe.Product)?.name ?? ''
  } catch {
    return ''
  }
}

// Looks up a member by Stripe customer ID first, then falls back to the
// customer's email address. If matched by email, saves the customer ID so
// future lookups work without the email fallback.
async function findMember(customerId: string) {
  const byId = await getMemberByStripeCustomerId(customerId)
  if (byId) return { member: byId, matchedBy: 'customer_id' as const }

  // Fetch customer email from Stripe and try email lookup
  try {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
    const email = customer.email?.toLowerCase().trim()
    if (!email) return null

    const byEmail = await getMemberByEmail(email)
    if (!byEmail) return null

    // Save the link so next sync (and all future webhooks) use customer ID
    await updateMemberCredential(byEmail._id, { stripeCustomerId: customerId })
    return { member: byEmail, matchedBy: 'email' as const }
  } catch {
    return null
  }
}

async function syncSubscription(
  sub: Stripe.Subscription,
  overrideStatus?: 'inactive',
): Promise<SyncResult> {
  const customerId = sub.customer as string

  const found = await findMember(customerId)
  if (!found) return { customerId, action: 'no_member' }

  const { member, matchedBy } = found

  try {
    if (overrideStatus === 'inactive') {
      await updateMemberCredential(member._id, { status: 'inactive' })
      await upsertMembership({
        memberId:  member._id,
        planName:  member.planOverride ?? '',
        status:    'CANCELED',
        startDate: '',
        endDate:   '',
      })
      return { customerId, memberEmail: member.email, matchedBy, action: 'updated', detail: 'inactive — subscription canceled' }
    }

    const priceId  = sub.items.data[0]?.price?.id ?? ''
    const nickname = sub.items.data[0]?.price?.nickname ?? null
    const planName = await resolvePlanName(priceId, nickname) || member.planOverride || ''

    const endDate = sub.current_period_end
      ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10)
      : undefined

    const stripeStatus = sub.status
    const isPaused     = !!((sub as unknown) as Record<string, unknown>).pause_collection
    const memberStatus =
      stripeStatus === 'past_due' ? 'past_due' :
      isPaused                    ? 'paused'   :
      /* active / trialing */       'active'

    await updateMemberCredential(member._id, {
      status:        memberStatus,
      ...(planName ? { planOverride:      planName } : {}),
      ...(endDate  ? { membershipEndDate: endDate   } : {}),
      ...(endDate  ? { nextBillingDate:   endDate   } : {}),
    })

    await upsertMembership({
      memberId:  member._id,
      planName:  planName,
      status:    'ACTIVE',
      startDate: sub.current_period_start
        ? new Date(sub.current_period_start * 1000).toISOString().slice(0, 10)
        : '',
      endDate:   endDate ?? '',
    })

    return { customerId, memberEmail: member.email, matchedBy, action: 'updated', detail: `${memberStatus} — ${planName}` }
  } catch (err) {
    return { customerId, memberEmail: member.email, matchedBy, action: 'error', detail: String(err) }
  }
}

export async function POST() {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const results: SyncResult[] = []

  // ── Active / trialing / past_due subscriptions ────────────────────────────
  const statusesToSync = ['active', 'trialing', 'past_due'] as const
  for (const status of statusesToSync) {
    let page = await stripe.subscriptions.list({ status, limit: 100 })
    while (true) {
      for (const sub of page.data) results.push(await syncSubscription(sub))
      if (!page.has_more) break
      page = await stripe.subscriptions.list({ status, limit: 100, starting_after: page.data[page.data.length - 1].id })
    }
  }

  // ── Subscriptions canceled in the last 30 days ────────────────────────────
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
  let canceledPage = await stripe.subscriptions.list({ status: 'canceled', limit: 100, created: { gte: since } })
  while (true) {
    for (const sub of canceledPage.data) results.push(await syncSubscription(sub, 'inactive'))
    if (!canceledPage.has_more) break
    canceledPage = await stripe.subscriptions.list({
      status: 'canceled', limit: 100, created: { gte: since },
      starting_after: canceledPage.data[canceledPage.data.length - 1].id,
    })
  }

  return NextResponse.json({
    updated:  results.filter(r => r.action === 'updated').length,
    noMember: results.filter(r => r.action === 'no_member').length,
    errors:   results.filter(r => r.action === 'error').length,
    results,
  })
}
