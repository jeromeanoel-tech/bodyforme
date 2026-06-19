import { NextRequest, NextResponse } from 'next/server'
import { getMemberByEmail, updateMemberCredential } from '@/lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { firstName, lastName, email, phone, address, suburb, state, postcode } = body

  if (!firstName || !email) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Confirm the member account has the Free Trial plan and 1 credit.
  // The register route already sets this, but we re-confirm here as a safety net.
  const member = await getMemberByEmail(email.toLowerCase().trim())
  if (!member) {
    // Shouldn't happen — register is called before this — but surface it if it does
    return NextResponse.json({ error: 'Account not found. Please try signing up again.' }, { status: 404 })
  }
  // Block existing active paying members — free trial is for new members only
  if (member.status === 'active' && member.planOverride && !['Free Trial', 'free-trial'].includes(member.planOverride)) {
    return NextResponse.json({ error: 'A paid membership already exists for this email. The free trial is for new members only.' }, { status: 409 })
  }
  await updateMemberCredential(member._id, {
    status:        'active',
    planOverride:  'Free Trial',
    creditBalance: 1,
  })

  const RESEND_KEY    = process.env.RESEND_API_KEY
  const STUDIO_EMAIL  = process.env.STUDIO_EMAIL ?? 'info@bodyforme.com.au'
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
      html: `<div style="background:#f4ede1;padding:56px 24px 96px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="width:100%;max-width:600px;margin:0 auto;background:#fdfaf6;border:1px solid #d8ccba;overflow:hidden">
    <div style="padding:32px 48px 28px;border-bottom:1px solid #d8ccba;background:#fdfaf6">
      <img src="https://bodyforme.com.au/bodyforme-wordmark.png" alt="BODYFORME" width="180" style="display:block;width:180px;height:auto;border:0">
    </div>
    <div style="padding:44px 48px 40px">
      <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#7a4a2a;margin-bottom:18px">Free Trial</div>
      <h1 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:36px;font-weight:500;line-height:1.12;color:#2a1506;margin:0 0 24px">Welcome, ${firstName}!</h1>
      <p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 18px">Thanks for registering for your free trial class at BodyForme Pilates.</p>
      <p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 18px">We'll be in touch shortly to confirm your first session. In the meantime, if you have any questions you're welcome to reply to this email or give us a call.</p>
      <p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 18px">We look forward to welcoming you to the studio.</p>
      <div style="margin-top:32px;font-size:15px;line-height:1.7;color:#2a1506">See you on the mat,</div>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #d8ccba">
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-style:italic;font-size:22px;color:#2a1506;line-height:1.2">Suzanne</div>
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7a4a2a;margin-top:5px;line-height:1.6">
          Studio Director &nbsp;·&nbsp; BodyForme Pilates<br>
          <a href="tel:0398502221" style="color:#7a4a2a;text-decoration:none">(03) 9850 2221</a>
          &nbsp;·&nbsp;
          <a href="mailto:hello@bodyforme.com.au" style="color:#7a4a2a;text-decoration:none">hello@bodyforme.com.au</a>
        </div>
      </div>
    </div>
    <div style="padding:28px 48px 36px;border-top:1px solid #d8ccba;background:#fdfaf6">
      <p style="font-size:12px;line-height:1.6;color:#a08568;margin:0 0 14px">
        <strong style="color:#2a1506;font-weight:600">BodyForme Pilates</strong> — 132 Ayr Street, Doncaster VIC 3108
      </p>
      <p style="margin-top:16px;font-size:11px;line-height:1.6;color:#a08568">
        You're receiving this because you registered for a free trial at BodyForme Pilates.
      </p>
    </div>
  </div>
</div>`,
    }),
  }).catch(err => console.error('Customer email error:', err))

  return NextResponse.json({ ok: true })
}
