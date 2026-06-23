/**
 * One-time Stripe recovery script.
 * Run: npx tsx scripts/recover-stripe.ts
 *
 * Step 1 — create/link Stripe customers for all members missing one
 * Step 2 — sync live subscription state into DB
 * Step 3 — replay checkout.session.completed + invoice.payment_failed (last 30 days)
 */

import * as fs   from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// ── Load .env.local ───────────────────────────────────────────────────────────

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      const val = m[2].trim().replace(/^"(.*)"$/, '$1')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim()
const SUPABASE_KEY = (process.env.SUPABASE_SECRET_KEY     ?? '').replace(/\\n|\n/g, '').trim()
const STRIPE_KEY   = (process.env.STRIPE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim()

if (!SUPABASE_URL || !SUPABASE_KEY || !STRIPE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, or STRIPE_SECRET_KEY')
  process.exit(1)
}

const db     = createClient(SUPABASE_URL, SUPABASE_KEY)
const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2024-04-10' as never })

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getMemberByEmail(email: string) {
  const { data } = await db.from('members').select('*').eq('email', email).single()
  return data ?? null
}

async function getMemberByCustomerId(customerId: string) {
  const { data } = await db.from('members').select('*').eq('stripe_customer_id', customerId).single()
  return data ?? null
}

async function updateMember(id: string, patch: Record<string, unknown>) {
  await db.from('members').update(patch).eq('id', id)
}

async function upsertMembership(memberId: string, planName: string, status: string, startDate: string, endDate: string) {
  await db.from('memberships').upsert(
    { member_id: memberId, plan_name: planName, status, start_date: startDate, end_date: endDate },
    { onConflict: 'member_id' },
  )
}

async function recordEvent(eventId: string): Promise<boolean> {
  const { error } = await db.from('stripe_events').insert({ event_id: eventId })
  if (!error) return true
  if (error.code === '23505') return false
  throw new Error(`stripe_events: ${error.message}`)
}

async function resolvePlanName(priceId: string, nickname: string | null): Promise<string> {
  if (nickname) return nickname
  if (!priceId) return ''
  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] }) as Stripe.Price & { product: Stripe.Product }
    return price.nickname ?? price.product?.name ?? ''
  } catch { return '' }
}

const CREDIT_PLANS = ['casual', 'pack', 'drop']
const PLAN_CREDITS: Record<string, number> = { casual: 1, '10pack': 10, '20pack': 20, '50pack': 50 }
const PLAN_MONTHS:  Record<string, number> = { '3month': 3, '6month': 6, '12month': 12 }

// ── Step 1: Bulk-create / link Stripe customers ───────────────────────────────

async function step1() {
  console.log('\n── Step 1: Link Stripe customers ──────────────────────')
  const { data: rows } = await db.from('members').select('id, first_name, last_name, email, stripe_customer_id')
  const members = (rows ?? []).filter((m: any) => !m.stripe_customer_id)
  console.log(`  ${members.length} members without a Stripe customer ID`)

  let created = 0, reused = 0, skipped = 0, failed = 0

  for (const m of members as any[]) {
    if (!m.email || m.email.includes('@bodyforme.placeholder') || m.email.includes('@bodyforme.internal')) {
      skipped++; continue
    }
    try {
      const existing = await stripe.customers.list({ email: m.email, limit: 1 })
      if (existing.data.length > 0) {
        await updateMember(m.id, { stripe_customer_id: existing.data[0].id })
        reused++
      } else {
        const customer = await stripe.customers.create({
          email:    m.email,
          name:     `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim(),
          metadata: { memberId: m.id },
        })
        await updateMember(m.id, { stripe_customer_id: customer.id })
        created++
      }
    } catch (err) {
      console.warn(`    ⚠ ${m.email}:`, err)
      failed++
    }
  }

  console.log(`  Created: ${created}  Reused: ${reused}  Skipped: ${skipped}  Failed: ${failed}`)
}

// ── Step 2: Sync live subscription state ──────────────────────────────────────

async function step2() {
  console.log('\n── Step 2: Sync subscriptions from Stripe ─────────────')
  let updated = 0, noMember = 0

  const statuses = ['active', 'trialing', 'past_due'] as const
  for (const status of statuses) {
    let page = await stripe.subscriptions.list({ status, limit: 100 })
    while (true) {
      for (const sub of page.data) {
        const customerId = sub.customer as string
        let member = await getMemberByCustomerId(customerId)
        if (!member) {
          // Try email fallback
          try {
            const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer
            if (customer.email) {
              member = await getMemberByEmail(customer.email.toLowerCase())
              if (member) await updateMember(member.id, { stripe_customer_id: customerId })
            }
          } catch { /* skip */ }
        }
        if (!member) { noMember++; continue }

        const priceId  = sub.items.data[0]?.price?.id ?? ''
        const nickname = sub.items.data[0]?.price?.nickname ?? null
        const planName = await resolvePlanName(priceId, nickname) || member.plan_override || ''
        const endDate  = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString().slice(0, 10) : undefined
        const memberStatus = status === 'past_due' ? 'past_due' : 'active'

        await updateMember(member.id, {
          status: memberStatus,
          ...(planName ? { plan_override: planName }      : {}),
          ...(endDate  ? { end_date: endDate }            : {}),
          ...(endDate  ? { next_billing_date: endDate }   : {}),
        })
        await upsertMembership(member.id, planName, 'ACTIVE',
          sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString().slice(0, 10) : '',
          endDate ?? '',
        )
        updated++
        console.log(`  ✓ ${member.email} — ${memberStatus} ${planName} → ${endDate ?? ''}`)
      }
      if (!page.has_more) break
      page = await stripe.subscriptions.list({ status, limit: 100, starting_after: page.data[page.data.length - 1].id })
    }
  }

  console.log(`  Updated: ${updated}  No match: ${noMember}`)
}

// ── Step 3: Replay missed checkout + payment_failed events ────────────────────

async function step3() {
  console.log('\n── Step 3: Replay missed events (last 30 days) ────────')
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60
  let processed = 0, skipped = 0, noMember = 0

  const eventTypes = ['checkout.session.completed', 'invoice.payment_failed']

  for (const eventType of eventTypes) {
    let page = await stripe.events.list({ type: eventType, limit: 100, created: { gte: since } })
    while (true) {
      for (const event of page.data) {
        const isNew = await recordEvent(event.id)
        if (!isNew) { skipped++; continue }

        const obj = event.data.object as Record<string, unknown>
        const meta = (obj.metadata ?? {}) as Record<string, string>

        if (event.type === 'checkout.session.completed') {
          if (obj.mode === 'setup' || meta.source === 'pos' || meta.source === 'member_app') {
            skipped++; continue
          }

          const email      = (obj.customer_email as string) ?? ''
          const customerId = (obj.customer as string) ?? ''
          const planKey    = meta.plan ?? ''
          const creditSeed = PLAN_CREDITS[planKey] ?? 0
          const months     = PLAN_MONTHS[planKey]

          let endDate: string | undefined
          if (months) {
            const d = new Date(event.created * 1000); d.setMonth(d.getMonth() + months)
            endDate = d.toISOString().slice(0, 10)
          } else if (planKey === 'intro-offer') {
            const d = new Date(event.created * 1000); d.setDate(d.getDate() + 7)
            endDate = d.toISOString().slice(0, 10)
          }

          let member = customerId ? await getMemberByCustomerId(customerId) : null
          if (!member && email) member = await getMemberByEmail(email.toLowerCase())
          if (!member) { noMember++; console.log(`  ✗ no member for ${email}`); continue }

          await updateMember(member.id, {
            status: 'active',
            ...(customerId            ? { stripe_customer_id: customerId }     : {}),
            ...(meta.plan             ? { plan_override: meta.plan }           : {}),
            ...(creditSeed > 0        ? { credit_balance: creditSeed }         : {}),
            ...(endDate               ? { end_date: endDate }                  : {}),
          })

          const isPack = CREDIT_PLANS.some(p => (meta.plan ?? '').toLowerCase().includes(p))
          if (!isPack && meta.plan) {
            await upsertMembership(member.id, meta.plan, 'ACTIVE',
              new Date(event.created * 1000).toISOString().slice(0, 10), endDate ?? '')
          }
          processed++
          console.log(`  ✓ checkout ${member.email} — ${meta.plan ?? 'unknown plan'}`)
        }

        if (event.type === 'invoice.payment_failed') {
          const customerId = (obj.customer as string) ?? ''
          const member = customerId ? await getMemberByCustomerId(customerId) : null
          if (!member) { noMember++; continue }
          await updateMember(member.id, { status: 'past_due' })
          processed++
          console.log(`  ✓ payment_failed ${member.email} → past_due`)
        }
      }
      if (!page.has_more) break
      page = await stripe.events.list({ type: eventType, limit: 100, created: { gte: since }, starting_after: page.data[page.data.length - 1].id })
    }
  }

  console.log(`  Processed: ${processed}  Already done: ${skipped}  No match: ${noMember}`)
}

// ── Run ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══ BodyForme: Stripe recovery ══\n')
  await step1()
  await step2()
  await step3()
  console.log('\n══ Done ══\n')
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
