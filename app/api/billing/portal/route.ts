import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getMemberByEmail } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL('/app/login', req.url))

  const member = await getMemberByEmail(session.email)
  const customerId = member?.stripeCustomerId

  if (!customerId) {
    return NextResponse.redirect(
      new URL('/app/membership?billing=no-account', req.url)
    )
  }

  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim()
  const returnUrl = `${req.nextUrl.origin}/app/membership`

  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ customer: customerId, return_url: returnUrl }).toString(),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Stripe portal error:', err)
    return NextResponse.redirect(
      new URL('/app/membership?billing=error', req.url)
    )
  }

  const { url } = await res.json() as { url: string }
  return NextResponse.redirect(url)
}
