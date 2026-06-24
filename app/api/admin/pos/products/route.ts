import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/adminSession'

export const dynamic = 'force-dynamic'

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim(), {
  apiVersion: '2026-04-22.dahlia' as never,
})

export type PosProduct = {
  id: string
  priceId: string
  name: string
  description: string
  amount: number
  memberAction: 'add_credits' | 'set_plan' | 'none'
  creditAmount: number
  planName: string
}

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const products = await stripe.products.list({ active: true, limit: 100 })

  const ALLOWED_PLAN_NAMES = new Set([
    'casual class',
    '10 class pack',
    '20 class pack',
    '50 class pass',
    '3 month unlimited',
    '6 month unlimited',
    '1 year unlimited',
  ])

  const posProducts = products.data.filter(p =>
    p.metadata.pos === 'true' &&
    ALLOWED_PLAN_NAMES.has((p.metadata.planName ?? '').toLowerCase())
  )

  const result: PosProduct[] = []
  for (const p of posProducts) {
    const priceId = typeof p.default_price === 'string' ? p.default_price : p.default_price?.id
    if (!priceId) {
      // Fall back to fetching the first active price for this product
      const prices = await stripe.prices.list({ product: p.id, active: true, limit: 1 })
      if (!prices.data.length) continue
      result.push({
        id:           p.id,
        priceId:      prices.data[0].id,
        name:         p.name,
        description:  p.description ?? '',
        amount:       prices.data[0].unit_amount ?? 0,
        memberAction: (p.metadata.memberAction as PosProduct['memberAction']) ?? 'none',
        creditAmount: Number(p.metadata.creditAmount ?? 0),
        planName:     p.metadata.planName ?? '',
      })
    } else {
      const price = await stripe.prices.retrieve(priceId)
      result.push({
        id:           p.id,
        priceId,
        name:         p.name,
        description:  p.description ?? '',
        amount:       price.unit_amount ?? 0,
        memberAction: (p.metadata.memberAction as PosProduct['memberAction']) ?? 'none',
        creditAmount: Number(p.metadata.creditAmount ?? 0),
        planName:     p.metadata.planName ?? '',
      })
    }
  }

  result.sort((a, b) => a.name.localeCompare(b.name))
  return NextResponse.json({ products: result })
}
