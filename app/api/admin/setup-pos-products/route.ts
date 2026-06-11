import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'

const STRIPE_KEY = () => (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n/g, '').trim()

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
  { name: '7-Day Unlimited',    description: 'All classes, unlimited, for 7 days. New members only.', amount: 4900, memberAction: 'set_plan',    creditAmount: '0',  planName: '7-Day Unlimited' },
  { name: '3 Month Unlimited',  description: 'Unlimited classes for 3 months. Prepaid upfront.',   amount: 66900,  memberAction: 'set_plan',    creditAmount: '0',  planName: '3 Month Unlimited' },
  { name: '6 Month Unlimited',  description: 'Unlimited classes for 6 months. Prepaid upfront.',   amount: 119900, memberAction: 'set_plan',    creditAmount: '0',  planName: '6 Month Unlimited' },
  { name: '1 Year Unlimited',   description: 'Unlimited classes for 12 months. Prepaid upfront.',  amount: 219900, memberAction: 'set_plan',    creditAmount: '0',  planName: '1 Year Unlimited' },
]

export async function POST() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch existing POS products so we can skip duplicates
  const existing = await stripeGet('products?limit=100&active=true')
  const existingNames = new Set(
    (existing.data ?? [])
      .filter(p => p.metadata?.pos === 'true')
      .map(p => p.name)
  )

  const results: { name: string; status: 'created' | 'skipped' }[] = []

  for (const p of POS_PRODUCTS) {
    if (existingNames.has(p.name)) {
      results.push({ name: p.name, status: 'skipped' })
      continue
    }

    // Create the Stripe product
    const product = await stripePost('products', {
      name:                  p.name,
      description:           p.description,
      'metadata[pos]':           'true',
      'metadata[memberAction]':  p.memberAction,
      'metadata[creditAmount]':  p.creditAmount,
      'metadata[planName]':      p.planName,
    })

    if (product.id) {
      // Create a default price for it
      await stripePost('prices', {
        product:      product.id as string,
        unit_amount:  String(p.amount),
        currency:     'aud',
      })
    }

    results.push({ name: p.name, status: 'created' })
  }

  const created = results.filter(r => r.status === 'created').length
  const skipped = results.filter(r => r.status === 'skipped').length

  return NextResponse.json({ ok: true, created, skipped, results })
}
