import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSession } from '@/lib/session'
import { getMemberById, updateMemberCredential } from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const member = await getMemberById(session.id)
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  let customerId = member.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email:    member.email,
      name:     `${member.firstName} ${member.lastName}`.trim(),
      metadata: { memberId: member._id },
    })
    customerId = customer.id
    try {
      await updateMemberCredential(member._id, { stripeCustomerId: customerId })
    } catch (err) {
      console.error('[setup-intent] Failed to save Stripe customer ID', member._id, customerId, err)
    }
  }

  const intent = await stripe.setupIntents.create({
    customer:             customerId,
    payment_method_types: ['au_becs_debit', 'card'],
    metadata:             { memberId: member._id },
  })

  return NextResponse.json({ clientSecret: intent.client_secret })
}
