import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { firstName, lastName, email, phone, address, suburb, state, postcode } = body

  if (!firstName || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const RESEND_KEY    = process.env.RESEND_API_KEY
  const STUDIO_EMAIL  = process.env.STUDIO_EMAIL ?? 'hello@bodyforme.com.au'
  const fullAddress   = [address, suburb, state, postcode].filter(Boolean).join(', ')

  if (!RESEND_KEY) {
    // Still return success so the user isn't blocked — studio will follow up manually
    console.warn('RESEND_API_KEY not set — free trial registration not emailed')
    return NextResponse.json({ ok: true })
  }

  // Send notification to studio
  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'BodyForme Website <hello@bodyforme.com.au>',
      to:      [STUDIO_EMAIL],
      subject: `New free trial registration — ${firstName} ${lastName}`,
      html: `
        <h2>New Free Trial Registration</h2>
        <table>
          <tr><td><strong>Name</strong></td><td>${firstName} ${lastName}</td></tr>
          <tr><td><strong>Email</strong></td><td>${email}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${phone}</td></tr>
          <tr><td><strong>Address</strong></td><td>${fullAddress}</td></tr>
        </table>
        <p>Follow up to confirm their first class booking.</p>
      `,
    }),
  }).catch(err => console.error('Studio email error:', err))

  // Send confirmation to customer
  await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'BodyForme Studio <hello@bodyforme.com.au>',
      to:      [email],
      subject: 'Your free trial at BodyForme is confirmed',
      html: `
        <p>Hi ${firstName},</p>
        <p>Thanks for registering for your free trial class at BodyForme Pilates.</p>
        <p>We'll be in touch shortly to confirm your first session. In the meantime, if you have any questions you can reply to this email or call us on (03) 9000 0000.</p>
        <p>We look forward to welcoming you to the studio.</p>
        <br />
        <p><strong>BodyForme Pilates</strong><br />
        132 Ayr Street, Doncaster VIC 3108</p>
      `,
    }),
  }).catch(err => console.error('Customer email error:', err))

  return NextResponse.json({ ok: true })
}
