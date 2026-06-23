import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getMemberByEmail } from '@/lib/db'
import { RECURRING_PLAN_BILLING } from '@/lib/content'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.redirect(new URL('/app/login', req.url))

  const member     = await getMemberByEmail(session.email)
  const customerId = member?.stripeCustomerId

  if (!customerId) {
    // Member has a recurring plan but no Stripe account — send to BECS setup
    const isRecurring = member?.planOverride && RECURRING_PLAN_BILLING[member.planOverride.toLowerCase()]
    return NextResponse.redirect(new URL(
      isRecurring ? '/app/setup-payment' : '/app/membership?billing=no-account',
      req.url,
    ))
  }

  // Check for active subscription — if none, send to BECS setup rather than a confusing empty portal
  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim()
  const subsRes = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active&limit=1`, {
    headers: { Authorization: `Bearer ${stripeKey}` },
  })
  const subsData = subsRes.ok ? await subsRes.json() : { data: [] }
  const hasActiveSub = (subsData.data?.length ?? 0) > 0

  const isRecurringPlan = member?.planOverride && RECURRING_PLAN_BILLING[member.planOverride.toLowerCase()]
  if (!hasActiveSub && isRecurringPlan) {
    return NextResponse.redirect(new URL('/app/setup-payment', req.url))
  }
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
