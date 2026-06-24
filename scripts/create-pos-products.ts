/**
 * One-time script: seeds POS products in Stripe.
 * Run with: npx tsx scripts/create-pos-products.ts
 * Requires STRIPE_SECRET_KEY in environment.
 */
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia' as never,
})

type Meta = Record<string, string>

const PRODUCTS: { name: string; description: string; amount: number; metadata: Meta }[] = [
  {
    name: 'Casual Drop-in',
    description: 'Single class drop-in pass',
    amount: 3500,
    metadata: { pos: 'true', memberAction: 'add_credits', creditAmount: '1', planName: '' },
  },
  {
    name: '5-Class Pack',
    description: '5 classes · 2-month expiry',
    amount: 16000,
    metadata: { pos: 'true', memberAction: 'add_credits', creditAmount: '5', planName: '' },
  },
  {
    name: '10-Class Pack',
    description: '10 classes · 3-month expiry',
    amount: 30000,
    metadata: { pos: 'true', memberAction: 'add_credits', creditAmount: '10', planName: '' },
  },
  {
    name: 'Mat Hire',
    description: 'Equipment hire per session',
    amount: 500,
    metadata: { pos: 'true', memberAction: 'none', creditAmount: '0', planName: '' },
  },
  {
    name: 'Towel Hire',
    description: 'Towel hire per session',
    amount: 300,
    metadata: { pos: 'true', memberAction: 'none', creditAmount: '0', planName: '' },
  },
  {
    name: 'Bronze Membership',
    description: '4 classes per month',
    amount: 12000,
    metadata: { pos: 'true', memberAction: 'set_plan', creditAmount: '0', planName: 'Bronze – $120/mo' },
  },
  {
    name: 'Silver Membership',
    description: '8 classes per month',
    amount: 20000,
    metadata: { pos: 'true', memberAction: 'set_plan', creditAmount: '0', planName: 'Silver – $200/mo' },
  },
  {
    name: 'Unlimited Membership',
    description: 'Unlimited classes per month',
    amount: 23900,
    metadata: { pos: 'true', memberAction: 'set_plan', creditAmount: '0', planName: 'Unlimited – $239/mo' },
  },
]

async function main() {
  console.log('Creating POS products in Stripe...\n')
  for (const p of PRODUCTS) {
    const product = await stripe.products.create({
      name: p.name,
      description: p.description,
      metadata: p.metadata,
    })
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: p.amount,
      currency: 'aud',
    })
    console.log(`✓ ${p.name} — product: ${product.id}  price: ${price.id}`)
  }
  console.log('\nDone! Products are live in Stripe.')
}

main().catch(err => { console.error(err); process.exit(1) })
