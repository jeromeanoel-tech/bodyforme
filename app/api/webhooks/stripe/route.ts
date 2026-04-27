import { NextRequest, NextResponse } from 'next/server'

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

  switch (event.type) {
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
