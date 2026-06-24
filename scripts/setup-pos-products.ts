/**
 * Creates/updates the 7 POS products in Stripe.
 * Safe to re-run — matches by name and updates existing products.
 */
import * as fs from 'fs'; import * as path from 'path'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|\"/g,'');if(!process.env[k])process.env[k]=v}}}
import Stripe from 'stripe'

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim(), { apiVersion: '2024-04-10' as never })

const POS_PRODUCTS = [
  { name: 'Casual Class',      description: 'Single drop-in class, any class type.',              amount: 3200,   memberAction: 'add_credits', creditAmount: '1',  planName: 'Casual Class' },
  { name: '10 Class Pack',     description: '10 classes at $28 per class. Any class type.',       amount: 28000,  memberAction: 'add_credits', creditAmount: '10', planName: '10 Class Pack' },
  { name: '20 Class Pack',     description: '20 classes at $25 per class. Any class type.',       amount: 50000,  memberAction: 'add_credits', creditAmount: '20', planName: '20 Class Pack' },
  { name: '50 Class Pass',     description: '50 classes at ~$20 per class. Any class type.',      amount: 99900,  memberAction: 'add_credits', creditAmount: '50', planName: '50 Class Pass' },
  { name: '3 Month Unlimited', description: 'Unlimited classes for 3 months. Prepaid upfront.',  amount: 66900,  memberAction: 'set_plan',    creditAmount: '0',  planName: '3 Month Unlimited' },
  { name: '6 Month Unlimited', description: 'Unlimited classes for 6 months. Prepaid upfront.',  amount: 119900, memberAction: 'set_plan',    creditAmount: '0',  planName: '6 Month Unlimited' },
  { name: '1 Year Unlimited',  description: 'Unlimited classes for 12 months. Prepaid upfront.', amount: 219900, memberAction: 'set_plan',    creditAmount: '0',  planName: '1 Year Unlimited' },
]

async function main() {
  console.log('\n══ Setup POS products in Stripe ══\n')

  const existing = await stripe.products.list({ active: true, limit: 100 })
  const byName = new Map(existing.data.map((p: any) => [p.name, p]))

  for (const def of POS_PRODUCTS) {
    const existing = byName.get(def.name)
    if (existing) {
      // Update metadata and description
      await stripe.products.update(existing.id, {
        description: def.description,
        metadata: { pos: 'true', memberAction: def.memberAction, creditAmount: def.creditAmount, planName: def.planName },
      })
      // Update price if amount differs
      const priceId = typeof existing.default_price === 'string' ? existing.default_price : existing.default_price?.id
      if (priceId) {
        const price = await stripe.prices.retrieve(priceId)
        if (price.unit_amount !== def.amount) {
          // Archive old price, create new one
          await stripe.prices.update(priceId, { active: false })
          const newPrice = await stripe.prices.create({ product: existing.id, currency: 'aud', unit_amount: def.amount })
          await stripe.products.update(existing.id, { default_price: newPrice.id })
          console.log(`  UPDATED price: ${def.name} → $${(def.amount/100).toFixed(2)}`)
        } else {
          console.log(`  OK: ${def.name}`)
        }
      }
    } else {
      // Create new product + price
      const product = await stripe.products.create({
        name: def.name,
        description: def.description,
        metadata: { pos: 'true', memberAction: def.memberAction, creditAmount: def.creditAmount, planName: def.planName },
      })
      const price = await stripe.prices.create({ product: product.id, currency: 'aud', unit_amount: def.amount })
      await stripe.products.update(product.id, { default_price: price.id })
      console.log(`  CREATED: ${def.name} @ $${(def.amount/100).toFixed(2)}`)
    }
  }

  console.log('\n══ Done ══\n')
}
main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
