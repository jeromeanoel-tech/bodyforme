/**
 * Stripe product + price setup for BodyForme.
 * Run once (or re-run safely — existing products are matched by metadata.planKey).
 *
 *   npx tsx scripts/setup-stripe.ts
 *
 * Requires STRIPE_SECRET_KEY in env (reads from .env.local automatically via tsx).
 */

import Stripe from 'stripe'
import * as fs from 'fs'
import * as path from 'path'

// Load .env.local manually (tsx doesn't auto-load it)
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, '')
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-04-22.dahlia' as never })

type Plan = {
  planKey: string
  name: string
  amount: number          // cents AUD
  mode: 'subscription' | 'payment'
  interval?: 'week'
}

const PLANS: Plan[] = [
  // Recurring subscription
  { planKey: 'weekly-unlimited', name: 'Unlimited Classes (Weekly)',   amount:   6200, mode: 'subscription', interval: 'week' },

  // One-time payments
  { planKey: 'intro-offer',      name: '7-Day Unlimited (Intro Offer)', amount:   4900, mode: 'payment' },
  { planKey: 'casual',           name: 'Casual Class',                  amount:   3200, mode: 'payment' },
  { planKey: '10pack',           name: '10 Class Pack',                 amount:  28000, mode: 'payment' },
  { planKey: '20pack',           name: '20 Class Pack',                 amount:  50000, mode: 'payment' },
  { planKey: '50pack',           name: '50 Class Pack',                 amount:  99900, mode: 'payment' },
  { planKey: '3month',           name: '3 Month Unlimited',             amount:  66900, mode: 'payment' },
  { planKey: '6month',           name: '6 Month Unlimited',             amount: 119900, mode: 'payment' },
  { planKey: '12month',          name: '1 Year Unlimited',              amount: 219900, mode: 'payment' },
]

async function findExistingProduct(planKey: string): Promise<Stripe.Product | null> {
  const products = await stripe.products.search({
    query: `metadata['planKey']:'${planKey}'`,
  })
  return products.data[0] ?? null
}

async function findActivePrice(productId: string, amount: number, mode: string, interval?: string): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 10 })
  return prices.data.find(p => {
    if (p.unit_amount !== amount) return false
    if (mode === 'subscription') return p.type === 'recurring' && p.recurring?.interval === interval
    return p.type === 'one_time'
  }) ?? null
}

async function run() {
  const results: Record<string, string> = {}

  for (const plan of PLANS) {
    process.stdout.write(`${plan.name} … `)

    // Find or create product
    let product = await findExistingProduct(plan.planKey)
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        metadata: { planKey: plan.planKey },
      })
      process.stdout.write('product created, ')
    } else {
      process.stdout.write('product found, ')
    }

    // Find or create price
    let price = await findActivePrice(product.id, plan.amount, plan.mode, plan.interval)
    if (!price) {
      const priceParams: Stripe.PriceCreateParams = {
        product:    product.id,
        currency:   'aud',
        unit_amount: plan.amount,
        metadata:   { planKey: plan.planKey },
        ...(plan.mode === 'subscription'
          ? { recurring: { interval: plan.interval! } }
          : {}
        ),
      }
      price = await stripe.prices.create(priceParams)
      process.stdout.write('price created\n')
    } else {
      process.stdout.write('price found\n')
    }

    results[plan.planKey] = price.id
  }

  console.log('\n── Price IDs ────────────────────────────────')
  for (const [key, id] of Object.entries(results)) {
    console.log(`  ${key.padEnd(20)} ${id}`)
  }

  console.log('\n── Add these to .env.local / Vercel env vars ─')
  for (const [key, id] of Object.entries(results)) {
    const envKey = `NEXT_PUBLIC_STRIPE_PRICE_${key.toUpperCase().replace(/-/g, '_')}`
    console.log(`${envKey}=${id}`)
  }
}

run().catch(err => { console.error(err); process.exit(1) })
