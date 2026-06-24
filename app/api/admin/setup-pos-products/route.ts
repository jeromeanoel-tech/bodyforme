import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'

const STRIPE_KEY = () => (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim()

async function stripePost(path: string, params: Record<string, string>) {
  const body = new URLSearchParams(params)
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_KEY()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })
  return res.json() as Promise<Record<string, unknown>>
}

async function stripeGet(path: string) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${STRIPE_KEY()}` },
  })
  return res.json() as Promise<{ data: Array<{ id: string; name: string; metadata: Record<string, string> }> }>
}

// POS product definitions — prices in AUD cents
const POS_PRODUCTS = [
  { name: 'Casual Class',       description: 'Single drop-in class, any class type.',               amount: 3200,   memberAction: 'add_credits', creditAmount: '1',  planName: 'Casual Class' },
  { name: '10 Class Pack',      description: '10 classes at $28 per class. Any class type.',        amount: 28000,  memberAction: 'add_credits', creditAmount: '10', planName: '10 Class Pack' },
  { name: '20 Class Pack',      description: '20 classes at $25 per class. Any class type.',        amount: 50000,  memberAction: 'add_credits', creditAmount: '20', planName: '20 Class Pack' },
  { name: '50 Class Pass',      description: '50 classes at ~$20 per class. Any class type.',       amount: 99900,  memberAction: 'add_credits', creditAmount: '50', planName: '50 Class Pass' },
  { name: '3 Month Unlimited',  description: 'Unlimited classes for 3 months. Prepaid upfront.',   amount: 66900,  memberAction: 'set_plan',    creditAmount: '0',  planName: '3 Month Unlimited' },
  { name: '6 Month Unlimited',  description: 'Unlimited classes for 6 months. Prepaid upfront.',   amount: 119900, memberAction: 'set_plan',    creditAmount: '0',  planName: '6 Month Unlimited' },
  { name: '1 Year Unlimited',   description: 'Unlimited classes for 12 months. Prepaid upfront.',  amount: 219900, memberAction: 'set_plan',    creditAmount: '0',  planName: '1 Year Unlimited' },
]

export async function POST() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch all existing POS products (keyed by name for easy lookup)
  const existing = await stripeGet('products?limit=100&active=true')
  const existingMap = new Map(
    (existing.data ?? [])
      .filter(p => p.metadata?.pos === 'true')
      .map(p => [p.name, p])
  )

  const results: { name: string; status: 'created' | 'updated' | 'ok' }[] = []

  for (const p of POS_PRODUCTS) {
    const existingProduct = existingMap.get(p.name)

    if (!existingProduct) {
      // Create the Stripe product
      const product = await stripePost('products', {
        name:                      p.name,
        description:               p.description,
        'metadata[pos]':           'true',
        'metadata[memberAction]':  p.memberAction,
        'metadata[creditAmount]':  p.creditAmount,
        'metadata[planName]':      p.planName,
      })
      if (product.id) {
        // Create and set default price
        const price = await stripePost('prices', {
          product:     product.id as string,
          unit_amount: String(p.amount),
          currency:    'aud',
        })
        if (price.id) {
          await stripePost(`products/${product.id as string}`, { default_price: price.id as string })
        }
      }
      results.push({ name: p.name, status: 'created' })
    } else {
      // Update product metadata/description to match current config
      await stripePost(`products/${existingProduct.id}`, {
        description:               p.description,
        'metadata[memberAction]':  p.memberAction,
        'metadata[creditAmount]':  p.creditAmount,
        'metadata[planName]':      p.planName,
      })

      // Check if the current default price matches the target amount
      const defaultPriceId = typeof existingProduct.metadata?.default_price === 'string'
        ? existingProduct.metadata.default_price
        : null

      // Fetch the actual default_price from the full product object via a fresh get
      const freshProduct = await stripeGet(`products/${existingProduct.id}`) as unknown as { default_price?: string }
      const currentPriceId = freshProduct.default_price

      let needsPriceUpdate = true
      if (currentPriceId) {
        const currentPrice = await stripeGet(`prices/${currentPriceId}`) as unknown as { unit_amount?: number }
        if (currentPrice.unit_amount === p.amount) needsPriceUpdate = false
      }

      if (needsPriceUpdate || !currentPriceId) {
        // Create a new price with the correct amount and set it as default
        const newPrice = await stripePost('prices', {
          product:     existingProduct.id,
          unit_amount: String(p.amount),
          currency:    'aud',
        })
        if (newPrice.id) {
          await stripePost(`products/${existingProduct.id}`, { default_price: newPrice.id as string })
        }
        results.push({ name: p.name, status: 'updated' })
      } else {
        results.push({ name: p.name, status: 'ok' })
      }
      void defaultPriceId
    }
  }

  const created = results.filter(r => r.status === 'created').length
  const updated = results.filter(r => r.status === 'updated').length
  const ok      = results.filter(r => r.status === 'ok').length

  return NextResponse.json({ ok: true, created, updated, unchanged: ok, results })
}
