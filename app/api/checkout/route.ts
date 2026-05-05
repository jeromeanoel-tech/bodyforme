import { NextRequest, NextResponse } from 'next/server'
import { signupPlans } from '@/lib/content'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { plan: planKey, firstName, lastName, email, phone, address, suburb, state, postcode } = body

  const plan = signupPlans[planKey as string]
  if (!plan || plan.mode === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_SECRET) {
    return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })
  }

  // Build the base URL from the request headers
  const host   = req.headers.get('host') ?? 'localhost:3000'
  const proto  = host.startsWith('localhost') ? 'http' : 'https'
  const base   = process.env.NEXT_PUBLIC_BASE_URL ?? `${proto}://${host}`

  const fullName   = `${firstName} ${lastName}`.trim()
  const successUrl = `${base}/sign-up/success?type=${plan.mode}&session_id={CHECKOUT_SESSION_ID}`
  const cancelUrl  = `${base}/sign-up?plan=${planKey}`

  const sessionPayload: Record<string, unknown> = {
    mode:                 plan.mode === 'subscription' ? 'subscription' : 'payment',
    customer_email:       email,
    success_url:          successUrl,
    cancel_url:           cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency:     'aud',
          unit_amount:  plan.amount,
          product_data: {
            name:        plan.name,
            description: plan.description,
          },
          ...(plan.mode === 'subscription' ? {
            recurring: { interval: 'month' },
          } : {}),
        },
      },
    ],
    metadata: {
      plan:      planKey,
      firstName,
      lastName,
      phone,
      address,
      suburb,
      state,
      postcode,
    },
    // Pre-fill customer name
    customer_creation: plan.mode === 'payment' ? 'if_required' : undefined,
  }

  if (plan.mode === 'subscription') {
    sessionPayload['subscription_data'] = {
      metadata: {
        plan,
        firstName,
        lastName,
        phone,
        address: `${address}, ${suburb} ${state} ${postcode}`,
      },
    }
  }

  // Create Stripe Checkout session via REST (no SDK needed)
  const params = new URLSearchParams()

  function flatten(obj: Record<string, unknown>, prefix = '') {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}[${k}]` : k
      if (v === null || v === undefined) continue
      if (Array.isArray(v)) {
        v.forEach((item, i) => {
          if (typeof item === 'object' && item !== null) {
            flatten(item as Record<string, unknown>, `${key}[${i}]`)
          } else {
            params.append(`${key}[${i}]`, String(item))
          }
        })
      } else if (typeof v === 'object') {
        flatten(v as Record<string, unknown>, key)
      } else {
        params.append(key, String(v))
      }
    }
  }

  flatten(sessionPayload)

  // Remove undefined values
  for (const [key] of [...params.entries()]) {
    if (params.get(key) === 'undefined') params.delete(key)
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${STRIPE_SECRET}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>
    const msg = (err.error as Record<string, string>)?.message ?? 'Payment setup failed'
    console.error('Stripe error:', err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const session = await res.json() as { url: string; id: string }
  return NextResponse.json({ url: session.url, sessionId: session.id })
}
