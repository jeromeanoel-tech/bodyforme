import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { getMemberById, updateMemberCredential } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { memberId } = await req.json() as { memberId: string }
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  const member = await getMemberById(memberId)
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  if (member.stripeCustomerId) {
    return NextResponse.json({
      customerId:   member.stripeCustomerId,
      dashboardUrl: `https://dashboard.stripe.com/customers/${member.stripeCustomerId}`,
    })
  }

  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n/g, '').trim()
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

  // Search Stripe by email first — avoids creating duplicates for members who
  // already have a Stripe customer (e.g. imported from MindBody or signed up
  // via checkout before their DB record was linked).
  let customerId: string

  const existing = await stripe.customers.list({ email: member.email, limit: 1 })
  if (existing.data.length > 0) {
    customerId = existing.data[0].id
  } else {
    const customer = await stripe.customers.create({
      email:    member.email,
      name:     `${member.firstName} ${member.lastName}`.trim(),
      metadata: { memberId: member._id },
    })
    customerId = customer.id
  }

  await updateMemberCredential(member._id, { stripeCustomerId: customerId })

  return NextResponse.json({
    customerId,
    dashboardUrl: `https://dashboard.stripe.com/customers/${customerId}`,
    linked: existing.data.length > 0,
  })
}
