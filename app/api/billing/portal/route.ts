import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getMemberByEmail } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL('/app/login', req.url))

  const member = await getMemberByEmail(session.email)
  const customerId = member?.stripeCustomerId

  if (!customerId) {
    // No Stripe customer yet — send them to the sign-up flow
    return NextResponse.redirect(new URL('/sign-up', req.url))
  }

  const returnUrl = `${req.nextUrl.origin}/app/membership`

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ customer: customerId, return_url: returnUrl }).toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Stripe portal error:', err)
    return NextResponse.json({ error: 'Could not open billing portal. Please contact the studio.' }, { status: 500 })
  }

  const { url } = await res.json() as { url: string }
  return NextResponse.redirect(url)
}
