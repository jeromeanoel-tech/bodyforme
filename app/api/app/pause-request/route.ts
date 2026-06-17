import { NextRequest, NextResponse } from 'next/server'
import { getMemberByContactId } from '@/lib/db'
import { getSession } from '@/lib/session'

const RESEND_API_KEY  = process.env.RESEND_API_KEY
const STUDIO_EMAIL    = process.env.STUDIO_EMAIL ?? 'info@bodyforme.com.au'
const FROM            = 'BodyForme App <hello@bodyforme.com.au>'

async function send(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { startDate, weeks, reason } = await req.json()
  if (!startDate || !weeks) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

  const member = await getMemberByContactId(session.id)
  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

  const name    = `${member.firstName} ${member.lastName}`.trim()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + weeks * 7)
  const endStr  = endDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })
  const startStr = new Date(startDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })

  // notify studio
  await send(STUDIO_EMAIL, `Membership pause request — ${name}`, `
    <h2 style="margin:0 0 16px;font-size:18px">Membership Pause Request</h2>
    <table style="border-collapse:collapse;width:100%;margin-bottom:20px">
      <tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px;white-space:nowrap">Member</td><td style="font-weight:600">${name}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px">Email</td><td>${member.email}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px">Phone</td><td>${member.phone || '—'}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px">Pause from</td><td>${startStr}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px">Duration</td><td>${weeks} week${weeks !== 1 ? 's' : ''} (until ${endStr})</td></tr>
      ${reason ? `<tr><td style="padding:6px 12px 6px 0;color:#888;font-size:13px;vertical-align:top">Reason</td><td>${reason}</td></tr>` : ''}
    </table>
    <p style="color:#666;font-size:13px">Action needed: process the pause in Stripe and confirm with the member.</p>
  `)

  // confirm to member
  await send(member.email, 'Membership pause request received', `
    <p>Hi ${member.firstName},</p>
    <p>We've received your request to pause your membership:</p>
    <table style="margin:16px 0;border-left:3px solid #7a4a2a;padding-left:14px;border-collapse:collapse">
      <tr><td style="color:#a08568;font-size:12px;padding:3px 16px 3px 0">Pause from</td><td style="color:#2a1506">${startStr}</td></tr>
      <tr><td style="color:#a08568;font-size:12px;padding:3px 16px 3px 0">Duration</td><td style="color:#2a1506">${weeks} week${weeks !== 1 ? 's' : ''} (until ${endStr})</td></tr>
    </table>
    <p>We'll confirm this by email within 1 business day. If you need to change anything, just reply to this email.</p>
    <hr style="margin:24px 0;border:none;border-top:1px solid #d8ccba">
    <p style="font-size:12px;color:#a08568;margin:0"><strong style="color:#2a1506">BodyForme Pilates</strong><br>132 Ayr Street, Doncaster VIC 3108</p>
  `)

  return NextResponse.json({ ok: true })
}
