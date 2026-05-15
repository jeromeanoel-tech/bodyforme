import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_TEMPLATES = ['reengagement-30', 'reengagement-90', 'review-request'] as const
type AllowedTemplate = typeof ALLOWED_TEMPLATES[number]

const WIX_WEBHOOK_SECRET = process.env.WIX_WEBHOOK_SECRET

export async function POST(req: NextRequest) {
  // Optional: verify Wix webhook secret header (set WIX_WEBHOOK_SECRET env var and
  // pass the same value as the Authorization header in Wix Automations)
  if (WIX_WEBHOOK_SECRET) {
    const auth = req.headers.get('authorization') ?? ''
    if (auth !== `Bearer ${WIX_WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Wix Automations lets you template the webhook body with contact fields.
  // Configure it to send: { "email": "{{contact.email}}", "firstName": "{{contact.firstName}}", "template": "reengagement-30" }
  const email     = (body.email     as string | undefined)?.trim()
  const firstName = (body.firstName as string | undefined)?.trim() ?? ''
  const template  = body.template as string | undefined

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }
  if (!template || !ALLOWED_TEMPLATES.includes(template as AllowedTemplate)) {
    return NextResponse.json({ error: `template must be one of: ${ALLOWED_TEMPLATES.join(', ')}` }, { status: 400 })
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'

  const res = await fetch(`${BASE_URL}/api/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      template,
      vars: {
        firstName,
        bookingUrl:  `${BASE_URL}/classes`,
        reviewUrl:   `https://g.page/r/bodyforme/review`,
        signupUrl:   `${BASE_URL}/sign-up`,
      },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Wix webhook email send error:', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
