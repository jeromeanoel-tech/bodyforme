import { NextRequest, NextResponse } from 'next/server'
import { getContacts } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

type Segment = 'all' | 'active-members' | 'expiring-soon' | 'new-this-month' | 'no-membership'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_ADDRESS   = 'BodyForme Studio <hello@bodyforme.com.au>'

function escHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function wrapHtml(firstName: string, body: string) {
  const bodyHtml = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n\n')
    .map(para => `<p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 18px">${para.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<div style="color-scheme:light;background-color:#f4ede1;padding:56px 24px 96px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="width:100%;max-width:600px;margin:0 auto;background-color:#fdfaf6;border:1px solid #d8ccba;overflow:hidden">
    <div style="padding:32px 48px 28px;border-bottom:1px solid #d8ccba;background-color:#f4ede1 !important">
      <img src="https://bodyforme.com.au/bodyforme-wordmark.png" alt="BODYFORME" width="180" style="display:block;width:180px;height:auto;border:0">
    </div>
    <div style="padding:44px 48px 40px;background-color:#fdfaf6">
      <p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 24px">Hi ${escHtml(firstName || 'there')},</p>
      ${bodyHtml}
      <div style="margin-top:32px;font-size:15px;line-height:1.7;color:#2a1506">Warm regards,</div>
      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #d8ccba">
        <div style="font-style:italic;font-size:22px;color:#2a1506;line-height:1.2">Suzanne</div>
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7a4a2a;margin-top:5px;line-height:1.8">
          Studio Director &middot; BodyForme Pilates<br>
          <a href="tel:0398502221" style="color:#7a4a2a;text-decoration:none">(03) 9850 2221</a>
          &middot;
          <a href="mailto:hello@bodyforme.com.au" style="color:#7a4a2a;text-decoration:none">hello@bodyforme.com.au</a>
        </div>
      </div>
    </div>
    <div style="padding:28px 48px 36px;border-top:1px solid #d8ccba;background-color:#fdfaf6">
      <p style="font-size:12px;line-height:1.6;color:#a08568;margin:0">
        <strong style="color:#2a1506;font-weight:600">BodyForme Pilates</strong> — 132 Ayr Street, Doncaster VIC 3108
      </p>
      <p style="margin-top:12px;font-size:11px;line-height:1.6;color:#a08568;margin-bottom:0">
        You're receiving this because you have an account with BodyForme Pilates.
      </p>
    </div>
  </div>
</div>`
}

function hasValidEmail(c: Awaited<ReturnType<typeof getContacts>>[number]) {
  return !!(c.email && !c.email.includes('@bodyforme.placeholder') && !c.email.includes('@bodyforme.internal'))
}

function filterRecipients(contacts: Awaited<ReturnType<typeof getContacts>>, segment: Segment) {
  const now           = Date.now()
  const thirtyDaysAgo = now - 30 * 86400000

  return contacts.filter(c => {
    if (!hasValidEmail(c)) return false

    switch (segment) {
      case 'all':
        return true
      case 'active-members':
        return c.memberStatus === 'active'
      case 'expiring-soon': {
        if (c.memberStatus !== 'active') return false
        const expiry = c.endDate ?? c.nextBillingDate
        if (!expiry) return false
        const days = Math.ceil((new Date(expiry).getTime() - now) / 86400000)
        return days >= 0 && days <= 14
      }
      case 'new-this-month':
        return new Date(c.createdDate).getTime() >= thirtyDaysAgo
      case 'no-membership':
        return !c.planOverride
    }
  })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { segment, subject, body }: { segment: Segment; subject: string; body: string } = await req.json()

    if (!segment || !subject || !body) {
      return NextResponse.json({ error: 'segment, subject and body are required' }, { status: 400 })
    }

    const contacts   = await getContacts()
    const recipients = filterRecipients(contacts, segment)

    if (recipients.length === 0) {
      return NextResponse.json({ ok: true, sent: 0, failed: 0, total: 0 })
    }

    // Resend batch API caps at 100 per call — chunk to stay within limit
    const CHUNK = 100
    let sent = 0
    for (let i = 0; i < recipients.length; i += CHUNK) {
      const chunk = recipients.slice(i, i + CHUNK)
      const batch = chunk.map(c => ({
        from:    FROM_ADDRESS,
        to:      c.email,
        subject,
        html:    wrapHtml(c.firstName, body),
      }))

      const res = await fetch('https://api.resend.com/emails/batch', {
        method:  'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(batch),
      })

      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: err, sent }, { status: res.status })
      }

      const data = await res.json() as { data?: { id: string }[] }
      sent += data.data?.length ?? chunk.length
    }

    return NextResponse.json({ ok: true, sent, failed: 0, total: recipients.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// Preview recipient count for a segment (no emails sent)
export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const segment = req.nextUrl.searchParams.get('segment') as Segment
    if (!segment) return NextResponse.json({ error: 'segment required' }, { status: 400 })

    const contacts = await getContacts()
    const count    = filterRecipients(contacts, segment).length

    return NextResponse.json({ count })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
