import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getAdminSession } from '@/lib/adminSession'

const stripe = new Stripe(
  (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n/g, '').trim(),
  { apiVersion: '2026-04-22.dahlia' }
)

export async function POST() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const token = await stripe.terminal.connectionTokens.create()
  return NextResponse.json({ secret: token.secret })
}
