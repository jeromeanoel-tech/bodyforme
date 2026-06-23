import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/adminSession'
import {
  getMemberByStripeCustomerId,
  getMemberByEmail,
  updateMemberCredential,
  upsertMembership,
  recordStripeEvent,
  CREDIT_PLANS,
} from '@/lib/db'
import { signupPlans } from '@/lib/content'

export const maxDuration = 60

const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim(),
  { apiVersion: '2024-04-10' as never },
)

const PLAN_CREDITS: Record<string, number> = {
  casual: 1, '10pack': 10, '20pack': 20, '50pack': 50,
}
const PLAN_MONTHS: Record<string, number> = { '3month': 3, '6month': 6, '12month': 12 }

async function findMember(customerId: string, email?: string) {
  const byId = await getMemberByStripeCustomerId(customerId)
  if (byId) return byId
  const addr = email?.toLowerCase().trim()
  if (!addr) return null
  const byEmail = await getMemberByEmail(addr)
  if (byEmail) {
    await updateMemberCredential(byEmail._id, { stripeCustomerId: customerId })
    return byEmail
  }
  return null
}

export async function POST() {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
  const results: { eventId: string; type: string; status: 'processed' | 'skipped' | 'no_member' | 'error'; detail?: string }[] = []

  const eventTypes = [
    'checkout.session.completed',
    'invoice.payment_failed',
  ]

  for (const eventType of eventTypes) {
    let page = await stripe.events.list({ type: eventType, limit: 100, created: { gte: since } })

    while (true) {
      for (const event of page.data) {
        // Skip already-processed events
        let isNew: boolean
        try {
          isNew = await recordStripeEvent(event.id)
        } catch {
          // Table error — mark and continue rather than aborting the whole replay
          results.push({ eventId: event.id, type: event.type, status: 'error', detail: 'stripe_events insert failed' })
          continue
        }
        if (!isNew) {
          results.push({ eventId: event.id, type: event.type, status: 'skipped' })
          continue
        }

        const obj = event.data.object as Record<string, unknown>

        try {
          if (event.type === 'checkout.session.completed') {
            const meta = (obj.metadata ?? {}) as Record<string, string>

            // Skip POS, setup, and renewals — not relevant for data recovery
            if (obj.mode === 'setup' || meta.source === 'pos' || meta.source === 'member_app') {
              results.push({ eventId: event.id, type: event.type, status: 'skipped', detail: meta.source ?? String(obj.mode) })
              continue
            }

            const email          = (obj.customer_email as string) ?? ''
            const customerId     = (obj.customer as string) ?? ''
            const planKey        = meta.plan ?? ''
            const planName       = signupPlans[planKey]?.name ?? planKey
            const creditSeed     = PLAN_CREDITS[planKey] ?? 0
            const prepaidMonths  = PLAN_MONTHS[planKey]

            let membershipEndDate: string | undefined
            if (prepaidMonths) {
              const d = new Date(event.created * 1000)
              d.setMonth(d.getMonth() + prepaidMonths)
              membershipEndDate = d.toISOString().slice(0, 10)
            } else if (planKey === 'intro-offer') {
              const d = new Date(event.created * 1000)
              d.setDate(d.getDate() + 7)
              membershipEndDate = d.toISOString().slice(0, 10)
            }

            const member = customerId ? await findMember(customerId, email) : (email ? await getMemberByEmail(email.toLowerCase().trim()) : null)
            if (!member) {
              results.push({ eventId: event.id, type: event.type, status: 'no_member', detail: email })
              continue
            }

            await updateMemberCredential(member._id, {
              status:        'active',
              ...(customerId        ? { stripeCustomerId: customerId }      : {}),
              ...(planName          ? { planOverride:     planName }         : {}),
              ...(creditSeed > 0    ? { creditBalance:    creditSeed }       : {}),
              ...(membershipEndDate ? { membershipEndDate }                  : {}),
            })

            const isPack = CREDIT_PLANS.some(p => planName.toLowerCase().includes(p.toLowerCase()))
            if (!isPack && planName) {
              const today = new Date(event.created * 1000).toISOString().slice(0, 10)
              await upsertMembership({
                memberId:  member._id,
                planName,
                status:    'ACTIVE',
                startDate: today,
                endDate:   membershipEndDate ?? '',
              })
            }

            results.push({ eventId: event.id, type: event.type, status: 'processed', detail: `${member.email} — ${planName}` })
          }

          if (event.type === 'invoice.payment_failed') {
            const inv = obj as { customer: string; customer_email: string }
            const member = inv.customer ? await getMemberByStripeCustomerId(inv.customer) : null
            if (!member) {
              results.push({ eventId: event.id, type: event.type, status: 'no_member' })
              continue
            }
            await updateMemberCredential(member._id, { status: 'past_due' })
            results.push({ eventId: event.id, type: event.type, status: 'processed', detail: member.email })
          }
        } catch (err) {
          results.push({ eventId: event.id, type: event.type, status: 'error', detail: String(err) })
        }
      }

      if (!page.has_more) break
      page = await stripe.events.list({ type: eventType, limit: 100, created: { gte: since }, starting_after: page.data[page.data.length - 1].id })
    }
  }

  return NextResponse.json({
    processed: results.filter(r => r.status === 'processed').length,
    skipped:   results.filter(r => r.status === 'skipped').length,
    noMember:  results.filter(r => r.status === 'no_member').length,
    errors:    results.filter(r => r.status === 'error').length,
    results,
  })
}
