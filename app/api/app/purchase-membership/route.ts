import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getMemberById } from '@/lib/db'
import { signupPlans } from '@/lib/content'

export async function POST(req: NextRequest) {
  const auth = await getSession()
  if (!auth) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const body = await req.json().catch(() => ({})) as { planKey?: string }
  const { planKey } = body

  if (!planKey) return NextResponse.json({ error: 'planKey required' }, { status: 400 })

  const plan = signupPlans[planKey]
  if (!plan || plan.mode === 'free') {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n/g, '').trim()
  if (!stripeKey) return NextResponse.json({ error: 'Payment not configured' }, { status: 500 })

  const member = await getMemberById(auth.id)
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const base = (process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au').replace(/\\n/g, '').trim()
  const successUrl = `${base}/app/membership?purchase=success`
  const cancelUrl  = `${base}/app/membership`

  const payload: Record<string, unknown> = {
    mode: plan.mode === 'subscription' ? 'subscription' : 'payment',
    ...(member.stripeCustomerId
      ? { customer: member.stripeCustomerId }
      : { customer_email: member.email }),
    success_url:           successUrl,
    cancel_url:            cancelUrl,
    allow_promotion_codes: true,
    ...(plan.mode === 'subscription'
      ? { payment_method_types: ['au_becs_debit', 'card'] }
      : {}),
    line_items: [{
      quantity:   1,
      price_data: {
        currency:     'aud',
        unit_amount:  plan.amount,
        product_data: { name: plan.name, description: plan.description },
        ...(plan.mode === 'subscription' ? {
          recurring: { interval: (plan as { billingInterval?: string }).billingInterval ?? 'week' },
        } : {}),
      },
    }],
    metadata: {
      plan:      planKey,
      memberId:  member._id,
      firstName: member.firstName,
      lastName:  member.lastName,
      source:    'member_app',
    },
    ...(plan.mode === 'subscription' ? {
      subscription_data: {
        metadata: {
          plan:      planKey,
          memberId:  member._id,
          firstName: member.firstName,
          lastName:  member.lastName,
        },
      },
    } : {}),
    ...(!member.stripeCustomerId && plan.mode === 'payment' ? { customer_creation: 'if_required' } : {}),
  }

  // Flatten nested object to form-encoded params (Stripe REST API format)
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
  flatten(payload)
  for (const [key] of [...params.entries()]) {
    if (params.get(key) === 'undefined') params.delete(key)
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method:  'POST',
    headers: {
      Authorization:  `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as Record<string, unknown>
    const msg = (err.error as Record<string, string>)?.message ?? 'Payment setup failed'
    console.error('[purchase-membership] Stripe error:', err)
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  const data = await res.json() as { url: string }
  return NextResponse.json({ url: data.url })
}
