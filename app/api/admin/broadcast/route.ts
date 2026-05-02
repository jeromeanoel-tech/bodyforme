import { NextRequest, NextResponse } from 'next/server'
import { getContacts, getMemberships } from '@/lib/wix'

type Segment = 'all' | 'active-members' | 'expiring-soon' | 'new-this-month' | 'no-membership'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_ADDRESS   = 'BodyForme Studio <hello@bodyforme.com.au>'

function wrapHtml(firstName: string, body: string, subject: string) {
  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
      <p>Hi ${firstName || 'there'},</p>
      ${escaped}
      <p style="margin-top:32px;color:#666;font-size:13px">
        — The BodyForme Team<br>
        <a href="https://bodyforme.com.au" style="color:#666">bodyforme.com.au</a>
      </p>
    </div>
  `
}

export async function POST(req: NextRequest) {
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
      if (!c.email) return false
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
      const html      = wrapHtml(firstName, body, subject)

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
      if (!c.email) return false
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
