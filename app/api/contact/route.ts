import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { name, email, subject, message } = await req.json()

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const RESEND_KEY = process.env.RESEND_API_KEY
  const STUDIO_EMAIL = process.env.STUDIO_EMAIL ?? 'hello@bodyforme.com.au'

  if (!RESEND_KEY) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'BodyForme Website <hello@bodyforme.com.au>',
      to:      [STUDIO_EMAIL],
      replyTo: email,
      subject: `Website enquiry: ${subject ?? 'General'}`,
      html: `
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <p>${message.replace(/\n/g, '<br />')}</p>
      `,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json({ error: (err as Record<string, string>).message ?? 'Send failed' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
