import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/adminSession'

const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n/g, '').trim(),
  { apiVersion: '2026-04-22.dahlia' }
)

type Action = {
  memberAction: string
  creditAmount: number
  planName:     string
  quantity:     number
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { amount, memberId, memberName, actions } = await req.json() as {
    amount:     number
    memberId:   string
    memberName: string
    actions:    Action[]
  }

  if (!amount || amount < 1) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency:             'aud',
    payment_method_types: ['card_present'],
    capture_method:       'automatic',
    metadata: {
      source:     'pos_terminal',
      memberId:   memberId   ?? '',
      memberName: memberName ?? '',
      actions:    JSON.stringify(actions ?? []),
    },
  })

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
