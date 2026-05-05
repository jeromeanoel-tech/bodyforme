import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_ADDRESS   = 'BodyForme Studio <hello@bodyforme.com.au>'

type Template = 'review-request' | 'reengagement-30' | 'reengagement-90' | 'payment-failed' | 'welcome' | 'custom'

interface EmailPayload {
  to:       string
  template: Template
  vars:     Record<string, string>
  // used when template === 'custom'
  subject?: string
  body?:    string
}

function buildEmail(template: Template, vars: Record<string, string>) {
  const first = vars.firstName ?? 'there'

  switch (template) {
    case 'review-request':
      return {
        subject: 'How was your first class at BodyForme?',
        html: `
          <p>Hi ${first},</p>
          <p>It was wonderful having you in class! We'd love to hear how your experience was.</p>
          <p>If you enjoyed it, a Google review means the world to a small studio like ours — it takes less than a minute:</p>
          <p><a href="${vars.reviewUrl ?? 'https://g.page/r/bodyforme/review'}">Leave a review →</a></p>
          <p>See you on the mat,<br>The BodyForme Team</p>
        `,
      }

    case 'reengagement-30':
      return {
        subject: "We've missed you at BodyForme",
        html: `
          <p>Hi ${first},</p>
          <p>It's been a little while since we've seen you in the studio — we hope you're doing well!</p>
          <p>Whenever you're ready to get back on the mat, your spot is waiting. Book a class anytime:</p>
          <p><a href="${vars.bookingUrl ?? 'https://bodyforme.com.au/classes'}">Browse classes →</a></p>
          <p>See you soon,<br>The BodyForme Team</p>
        `,
      }

    case 'reengagement-90':
      return {
        subject: 'Still thinking about Pilates?',
        html: `
          <p>Hi ${first},</p>
          <p>It's been a while since your last class at BodyForme. Life gets busy — we get it!</p>
          <p>If you'd like to ease back in, our introductory options make it easy to start again with no pressure:</p>
          <p><a href="${vars.bookingUrl ?? 'https://bodyforme.com.au/classes'}">See what's on →</a></p>
          <p>We'd love to have you back,<br>The BodyForme Team</p>
        `,
      }

    case 'payment-failed':
      return {
        subject: 'Action needed: payment issue with your BodyForme membership',
        html: `
          <p>Hi ${first},</p>
          <p>We had trouble processing your payment for your ${vars.planName ?? 'membership'}.</p>
          <p>To keep your membership active, please update your payment details:</p>
          <p><a href="${vars.portalUrl ?? 'https://bodyforme.com.au/account'}">Update payment →</a></p>
          <p>If you have any questions, just reply to this email.</p>
          <p>The BodyForme Team</p>
        `,
      }

    case 'welcome':
      return {
        subject: `Welcome to BodyForme — you're all set`,
        html: `
          <p>Hi ${first},</p>
          <p>Your <strong>${vars.planName ?? 'plan'}</strong> is now active. You can start booking classes straight away.</p>
          <p><a href="${vars.bookingUrl ?? 'https://bodyforme.com.au/classes'}">Browse the timetable →</a></p>
          <p>If you have any questions, just reply to this email or call us on ${vars.phone ?? '(03) 9000 0000'}.</p>
          <p>We look forward to seeing you on the mat.</p>
          <br>
          <p><strong>BodyForme Pilates</strong><br>132 Ayr Street, Doncaster VIC 3108</p>
        `,
      }

    case 'custom':
      return { subject: vars.subject ?? '(no subject)', html: vars.html ?? '' }
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload: EmailPayload = await req.json()
    const { to, template, vars } = payload

    if (!to || !template) {
      return NextResponse.json({ error: 'to and template are required' }, { status: 400 })
    }

    const mergedVars = {
      ...(vars ?? {}),
      ...(template === 'custom' && payload.subject ? { subject: payload.subject } : {}),
      ...(template === 'custom' && payload.body    ? { html: payload.body.replace(/\n/g, '<br>') } : {}),
    }

    const { subject, html } = buildEmail(template, mergedVars)

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: err }, { status: res.status })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
