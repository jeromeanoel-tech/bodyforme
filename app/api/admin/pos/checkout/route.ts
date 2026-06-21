import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/adminSession'

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n/g, '').trim(), {
  apiVersion: '2026-04-22.dahlia',
})

export type CheckoutItem = {
  priceId:      string
  quantity:     number
  memberAction: string
  creditAmount: number
  planName:     string
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { memberId, memberEmail, memberName, items } = await req.json() as {
    memberId:    string
    memberEmail: string
    memberName:  string
    items:       CheckoutItem[]
  }

  if (!memberId) {
    return NextResponse.json({ error: 'memberId is required for POS sales' }, { status: 400 })
  }
  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au').replace(/\\n/g, '').trim()

  let session: Awaited<ReturnType<typeof stripe.checkout.sessions.create>>
  try {
    session = await stripe.checkout.sessions.create({
    mode:           'payment',
    customer_email: memberEmail || undefined,
    line_items:     items.map(i => ({ price: i.priceId, quantity: i.quantity })),
    metadata: {
      source:     'pos',
      memberId:   memberId   ?? '',
      memberName: memberName ?? '',
      actions:    JSON.stringify(
        items.map(i => ({
          memberAction: i.memberAction,
          creditAmount: i.creditAmount,
          planName:     i.planName,
          quantity:     i.quantity,
        }))
      ),
    },
      success_url: `${base}/admin/pos?success=1`,
      cancel_url:  `${base}/admin/pos`,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[POS checkout]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
