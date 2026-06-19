import { NextRequest, NextResponse } from 'next/server'
import { getContacts, getMemberships } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

type Segment = 'all' | 'active-members' | 'expiring-soon' | 'new-this-month' | 'no-membership'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_ADDRESS   = 'BodyForme Studio <hello@bodyforme.com.au>'

function wrapHtml(firstName: string, body: string) {
  const bodyHtml = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n\n')
    .map(para => `<p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 18px">${para.replace(/\n/g, '<br>')}</p>`)
    .join('')

  return `<div style="background:#f4ede1;padding:56px 24px 96px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="width:100%;max-width:600px;margin:0 auto;background:#fdfaf6;border:1px solid #d8ccba;overflow:hidden">
    <div style="padding:32px 48px 28px;border-bottom:1px solid #d8ccba;background:#fdfaf6">
      <img src="https://bodyforme.com.au/bodyforme-wordmark.png" alt="BODYFORME" width="180" style="display:block;width:180px;height:auto;border:0">
    </div>
    <div style="padding:44px 48px 40px">
      <p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 24px">Hi ${firstName || 'there'},</p>
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
    <div style="padding:28px 48px 36px;border-top:1px solid #d8ccba;background:#fdfaf6">
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

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { segment, subject, body }: { segment: Segment; subject: string; body: string } = await req.json()

    if (!segment || !subject || !body) {
      return NextResponse.json({ error: 'segment, subject and body are required' }, { status: 400 })
    }

    const [contacts, memberships] = await Promise.all([getContacts(), getMemberships()])

    const activeIds      = new Set(memberships.filter(m => m.status === 'ACTIVE').map(m => m.contactId))
    const expiringIds    = new Set(
      memberships
        .filter(m => {
          if (m.status !== 'ACTIVE' || !m.endDate) return false
          const days = Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000)
          return days >= 0 && days <= 14
        })
        .map(m => m.contactId)
    )
    const thirtyDaysAgo  = Date.now() - 30 * 86400000
    const memberIds      = new Set(memberships.map(m => m.contactId))

    const recipients = contacts.filter(c => {
      if (!c.email || c.memberStatus !== 'active') return false
      switch (segment) {
        case 'all':            return true
        case 'active-members': return activeIds.has(c.id)
        case 'expiring-soon':  return expiringIds.has(c.id)
        case 'new-this-month': return new Date(c.createdDate).getTime() >= thirtyDaysAgo
        case 'no-membership':  return !memberIds.has(c.id)
      }
    })

    let sent   = 0
    let failed = 0

    for (const contact of recipients) {
      const firstName = contact.firstName || ''
      const html      = wrapHtml(firstName, body)

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_ADDRESS, to: contact.email, subject, html }),
      })

      if (res.ok) sent++
      else failed++

      // Small delay to stay within Resend rate limits
      if (sent + failed < recipients.length) {
        await new Promise(r => setTimeout(r, 50))
      }
    }

    return NextResponse.json({ ok: true, sent, failed, total: recipients.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// Preview how many recipients a segment would target (no emails sent)
export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const segment = req.nextUrl.searchParams.get('segment') as Segment
    if (!segment) return NextResponse.json({ error: 'segment required' }, { status: 400 })

    const [contacts, memberships] = await Promise.all([getContacts(), getMemberships()])

    const activeIds   = new Set(memberships.filter(m => m.status === 'ACTIVE').map(m => m.contactId))
    const expiringIds = new Set(
      memberships
        .filter(m => {
          if (m.status !== 'ACTIVE' || !m.endDate) return false
          const days = Math.ceil((new Date(m.endDate).getTime() - Date.now()) / 86400000)
          return days >= 0 && days <= 14
        })
        .map(m => m.contactId)
    )
    const thirtyDaysAgo = Date.now() - 30 * 86400000
    const memberIds     = new Set(memberships.map(m => m.contactId))

    const count = contacts.filter(c => {
      if (!c.email || c.memberStatus !== 'active') return false
      switch (segment) {
        case 'all':            return true
        case 'active-members': return activeIds.has(c.id)
        case 'expiring-soon':  return expiringIds.has(c.id)
        case 'new-this-month': return new Date(c.createdDate).getTime() >= thirtyDaysAgo
        case 'no-membership':  return !memberIds.has(c.id)
      }
    }).length

    return NextResponse.json({ count })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
