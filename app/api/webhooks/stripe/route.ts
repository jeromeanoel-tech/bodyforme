import { NextRequest, NextResponse } from 'next/server'
import { signupPlans } from '@/lib/content'
import { getMemberByEmail, updateMemberCredential, getMemberById } from '@/lib/db'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!

// Verify Stripe webhook signature without the Stripe SDK
async function verifyStripeSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const parts    = Object.fromEntries(signature.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const sigHex   = parts['v1']
  if (!timestamp || !sigHex) return false

  const signedPayload = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload))
  const computed = Buffer.from(sig).toString('hex')
  return computed === sigHex
}

async function sendEmail(to: string, template: string, vars: Record<string, string>) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'
  await fetch(`${base}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, template, vars }),
  })
}

export async function POST(req: NextRequest) {
  const payload   = await req.text()
  const signature = req.headers.get('stripe-signature') ?? ''

  if (STRIPE_WEBHOOK_SECRET) {
    const valid = await verifyStripeSignature(payload, signature, STRIPE_WEBHOOK_SECRET)
    if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const obj = event.data.object

  const STUDIO_EMAIL = process.env.STUDIO_EMAIL ?? 'hello@bodyforme.com.au'
  const BASE_URL     = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'

  switch (event.type) {
    case 'checkout.session.completed': {
      const meta = (obj.metadata ?? {}) as Record<string, string>

      // ── POS sale ──────────────────────────────────────────────────────────
      if (meta.source === 'pos') {
        const memberId = meta.memberId ?? ''
        const actions: { memberAction: string; creditAmount: number; planName: string; quantity: number }[] =
          JSON.parse(meta.actions ?? '[]')

        if (memberId) {
          const member = await getMemberById(memberId)
          if (member) {
            let newCreditBalance = member.creditBalance
            let newPlanOverride  = member.planOverride
            let newStatus        = member.status ?? 'active'

            for (const action of actions) {
              if (action.memberAction === 'add_credits') {
                newCreditBalance += (action.creditAmount ?? 0) * (action.quantity ?? 1)
              } else if (action.memberAction === 'set_plan') {
                newPlanOverride = action.planName
                newStatus       = 'active'
              }
            }

            await updateMemberCredential(memberId, {
              creditBalance: newCreditBalance,
              planOverride:  newPlanOverride,
              status:        newStatus,
            })
          }
        }
        break
      }

      // ── Standard sign-up checkout ─────────────────────────────────────────
      const email     = (obj.customer_email as string) ?? ''
      const firstName = meta.firstName ?? ''
      const lastName  = meta.lastName  ?? ''
      const planKey   = meta.plan ?? ''
      const planName  = signupPlans[planKey]?.name ?? planKey
      const fullName  = `${firstName} ${lastName}`.trim()

      // Credits to seed for one-time class packs
      const PLAN_CREDITS: Record<string, number> = {
        'casual': 1, 'intro-offer': 0,
        '10pack': 10, '20pack': 20, '50pack': 50,
      }
      const creditSeed = PLAN_CREDITS[planKey] ?? 0

      // Activate member account and set plan
      if (email) {
        const stripeCustomerId = (obj.customer as string) ?? ''
        const member = await getMemberByEmail(email)
        if (member) {
          await updateMemberCredential(member._id, {
            status:        'active',
            stripeCustomerId,
            planOverride:  planName,
            creditBalance: creditSeed > 0 ? creditSeed : member.creditBalance,
          })
        }

        await sendEmail(email, 'welcome', {
          firstName,
          planName,
          bookingUrl: `${BASE_URL}/classes`,
        })
      }

      await sendEmail(STUDIO_EMAIL, 'custom', {
        subject: `New sign-up — ${fullName || email} (${planName})`,
        html: `
          <h2>New Sign-Up via Stripe Checkout</h2>
          <table cellpadding="6">
            <tr><td><strong>Name</strong></td><td>${fullName}</td></tr>
            <tr><td><strong>Email</strong></td><td>${email}</td></tr>
            <tr><td><strong>Plan</strong></td><td>${planName}</td></tr>
            <tr><td><strong>Phone</strong></td><td>${meta.phone ?? ''}</td></tr>
            <tr><td><strong>Address</strong></td><td>${[meta.address, meta.suburb, meta.state, meta.postcode].filter(Boolean).join(', ')}</td></tr>
          </table>
        `,
      })
      break
    }

    case 'invoice.payment_failed': {
      const email     = (obj.customer_email as string) ?? ''
      const firstName = (obj.customer_name  as string)?.split(' ')[0] ?? ''
      const planName  = ((obj.lines as { data: { description: string }[] })?.data?.[0]?.description) ?? 'membership'
      if (email) {
        await sendEmail(email, 'payment-failed', { firstName, planName })
      }
      break
    }

    case 'customer.subscription.deleted': {
      // Subscription cancelled — log for now, extend later if needed
      console.log('Subscription cancelled:', obj.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
