import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getMemberByEmail, updateMemberCredential } from '@/lib/db'
import { getSession } from '@/lib/session'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const BASE   = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { email } = await req.json() as { email: string }
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Prevent one member from setting up payment for another member's account
  if (session.email.toLowerCase() !== email.toLowerCase().trim()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const member = await getMemberByEmail(email.toLowerCase().trim())
  if (!member) return NextResponse.json({ error: 'No account found for that email.' }, { status: 404 })

  // Reuse existing Stripe customer or create one
  let customerId = member.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: member.email,
      name:  `${member.firstName} ${member.lastName}`,
      metadata: { memberId: member._id },
    })
    customerId = customer.id
    try {
      await updateMemberCredential(member._id, { stripeCustomerId: customerId })
    } catch (err) {
      console.error('[create-setup-session] Failed to save Stripe customer ID', member._id, customerId, err)
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode:                 'setup',
    customer:             customerId,
    payment_method_types: ['au_becs_debit'],
    success_url:          `${BASE}/app/setup-payment/success`,
    cancel_url:           `${BASE}/app/setup-payment`,
    metadata:             { memberId: member._id },
    custom_text: {
      submit: { message: 'By providing your bank details you authorise BodyForme Pilates to debit your account for your membership.' },
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
