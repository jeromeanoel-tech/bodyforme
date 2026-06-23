import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/adminSession'
import { getMemberByStripeCustomerId, updateMemberCredential, upsertMembership } from '@/lib/db'

export const maxDuration = 60

const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim(),
  { apiVersion: '2024-04-10' as never },
)

type SyncResult = {
  customerId: string
  memberEmail?: string
  action: 'updated' | 'no_member' | 'error'
  detail?: string
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

export async function POST() {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const results: SyncResult[] = []

  // ── Sync active / trialing / past_due subscriptions ──────────────────────
  const statusesToSync = ['active', 'trialing', 'past_due'] as const
  for (const status of statusesToSync) {
    let page = await stripe.subscriptions.list({ status, limit: 100, expand: [] })
    while (true) {
      for (const sub of page.data) {
        const customerId = sub.customer as string
        try {
          const member = await getMemberByStripeCustomerId(customerId)
          if (!member) {
            results.push({ customerId, action: 'no_member' })
            continue
          }

          const priceId   = sub.items.data[0]?.price?.id ?? ''
          const nickname  = sub.items.data[0]?.price?.nickname ?? null
          const planName  = await resolvePlanName(priceId, nickname) || member.planOverride || ''

          const endDate = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10)
            : undefined

          const memberStatus =
            status === 'past_due'  ? 'past_due' :
            status === 'trialing'  ? 'active'   :
            /* active */             'active'

          await updateMemberCredential(member._id, {
            status:        memberStatus,
            ...(planName  ? { planOverride:      planName } : {}),
            ...(endDate   ? { membershipEndDate: endDate   } : {}),
            ...(endDate   ? { nextBillingDate:   endDate   } : {}),
          })

          await upsertMembership({
            memberId:  member._id,
            planName:  planName,
            status:    status === 'past_due' ? 'ACTIVE' : 'ACTIVE',
            startDate: sub.current_period_start
              ? new Date(sub.current_period_start * 1000).toISOString().slice(0, 10)
              : '',
            endDate:   endDate ?? '',
          })

          results.push({ customerId, memberEmail: member.email, action: 'updated', detail: `${memberStatus} — ${planName}` })
        } catch (err) {
          results.push({ customerId, action: 'error', detail: String(err) })
        }
      }
      if (!page.has_more) break
      page = await stripe.subscriptions.list({ status, limit: 100, starting_after: page.data[page.data.length - 1].id })
    }
  }

  // ── Sync subscriptions canceled in the last 30 days ──────────────────────
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
  let canceledPage = await stripe.subscriptions.list({
    status: 'canceled',
    limit:  100,
    created: { gte: since },
  })
  while (true) {
    for (const sub of canceledPage.data) {
      const customerId = sub.customer as string
      try {
        const member = await getMemberByStripeCustomerId(customerId)
        if (!member) {
          results.push({ customerId, action: 'no_member' })
          continue
        }
        await updateMemberCredential(member._id, { status: 'inactive' })
        await upsertMembership({
          memberId:  member._id,
          planName:  member.planOverride ?? '',
          status:    'CANCELED',
          startDate: '',
          endDate:   '',
        })
        results.push({ customerId, memberEmail: member.email, action: 'updated', detail: 'inactive — subscription canceled' })
      } catch (err) {
        results.push({ customerId, action: 'error', detail: String(err) })
      }
    }
    if (!canceledPage.has_more) break
    canceledPage = await stripe.subscriptions.list({
      status: 'canceled',
      limit:  100,
      created: { gte: since },
      starting_after: canceledPage.data[canceledPage.data.length - 1].id,
    })
  }

  const updated  = results.filter(r => r.action === 'updated').length
  const noMember = results.filter(r => r.action === 'no_member').length
  const errors   = results.filter(r => r.action === 'error').length

  return NextResponse.json({ updated, noMember, errors, results })
}
