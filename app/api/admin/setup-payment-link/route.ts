import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getMemberByEmail, updateMemberCredential } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const BASE   = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { email } = await req.json() as { email: string }
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const member = await getMemberByEmail(email.toLowerCase().trim())
  if (!member) return NextResponse.json({ error: 'No account found for that email.' }, { status: 404 })

  let customerId = member.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    member.email,
      name:     `${member.firstName} ${member.lastName}`.trim(),
      metadata: { memberId: member._id },
    })
    customerId = customer.id
    await updateMemberCredential(member._id, { stripeCustomerId: customerId })
  }

  const checkout = await stripe.checkout.sessions.create({
    mode:                 'setup',
    customer:             customerId,
    payment_method_types: ['au_becs_debit', 'card'],
    success_url:          `${BASE}/app/setup-payment/success`,
    cancel_url:           `${BASE}/app/setup-payment`,
    metadata:             { memberId: member._id },
    custom_text: {
      submit: { message: 'By providing your bank details you authorise BodyForme Pilates to debit your account for your membership.' },
    },
  })

  return NextResponse.json({ url: checkout.url })
}
