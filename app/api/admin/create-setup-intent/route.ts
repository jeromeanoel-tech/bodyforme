import { NextRequest, NextResponse } from 'next/server'
import { getMemberByEmail, updateMemberCredential } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { email } = await req.json() as { email: string }
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim()
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

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

    const intent = await stripe.setupIntents.create({
      customer:             customerId,
      payment_method_types: ['card', 'au_becs_debit'],
      metadata:             { memberId: member._id },
    })

    return NextResponse.json({ clientSecret: intent.client_secret })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[create-setup-intent] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
