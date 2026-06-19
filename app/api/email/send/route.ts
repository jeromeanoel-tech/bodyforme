import { NextRequest, NextResponse } from 'next/server'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_ADDRESS   = 'BodyForme Studio <hello@bodyforme.com.au>'
const BASE           = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'

type Template = 'review-request' | 'reengagement-30' | 'reengagement-90' | 'payment-failed' | 'welcome' | 'migration' | 'dd-payment-setup' | 'member-onboarding' | 'custom'

interface EmailPayload {
  to:       string
  template: Template
  vars:     Record<string, string>
  subject?: string
  body?:    string
}

// ── Shared layout ─────────────────────────────────────────────────────────────

const HEADER = `
  <div style="padding:32px 48px 28px;border-bottom:1px solid #d8ccba;background:#fdfaf6">
    <img src="${BASE}/bodyforme-wordmark.png" alt="BODYFORME" width="180" style="display:block;width:180px;height:auto;border:0">
  </div>`

const FOOTER = `
  <div style="padding:28px 48px 36px;border-top:1px solid #d8ccba;background:#fdfaf6">
    <p style="font-size:12px;line-height:1.6;color:#a08568;margin:0">
      <strong style="color:#2a1506;font-weight:600">BodyForme Pilates</strong> — 132 Ayr Street, Doncaster VIC 3108
    </p>
    <p style="margin-top:12px;font-size:11px;line-height:1.6;color:#a08568;margin-bottom:0">
      You're receiving this because you have an account with BodyForme Pilates.
    </p>
  </div>`

function wrap(body: string) {
  return `<div style="background:#f4ede1;padding:56px 24px 96px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <div style="width:100%;max-width:600px;margin:0 auto;background:#fdfaf6;border:1px solid #d8ccba;overflow:hidden">
    ${HEADER}
    <div style="padding:44px 48px 40px">
      ${body}
    </div>
    ${FOOTER}
  </div>
</div>`
}

function eyebrow(text: string) {
  return `<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#7a4a2a;margin-bottom:18px">${text}</div>`
}

function heading(html: string) {
  return `<h1 style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:38px;font-weight:500;line-height:1.12;color:#2a1506;margin:0 0 24px">${html}</h1>`
}

function p(html: string, muted = false) {
  return `<p style="font-size:15px;line-height:1.72;color:${muted ? '#a08568' : '#2a1506'};margin:0 0 18px">${html}</p>`
}

function cta(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:#2a1506;color:#f4ede1;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;padding:15px 34px;margin:12px 0 8px">${label}</a>`
}

function detailBox(rows: [string, string][]) {
  const rowHtml = rows.map((([k, v], i) =>
    `<tr><td style="padding:7px 0${i > 0 ? ';border-top:1px solid #d8ccba' : ''};font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#a08568;width:50%">${k}</td>
     <td style="padding:7px 0${i > 0 ? ';border-top:1px solid #d8ccba' : ''};font-size:14px;font-weight:500;color:#2a1506;text-align:right">${v}</td></tr>`
  )).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4ede1;border:1px solid #d8ccba;padding:20px 24px;margin:6px 0 26px"><tbody>${rowHtml}</tbody></table>`
}

function signoff(line: string) {
  return `<div style="margin-top:32px;font-size:15px;line-height:1.7;color:#2a1506">
    ${line}
  </div>
  <div style="margin-top:20px;padding-top:20px;border-top:1px solid #d8ccba">
    <div style="display:flex;align-items:flex-start;gap:16px">
      <div>
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-style:italic;font-size:22px;color:#2a1506;line-height:1.2">Suzanne</div>
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7a4a2a;margin-top:5px;line-height:1.6">
          Studio Director &nbsp;·&nbsp; BodyForme Pilates<br>
          <a href="tel:0398502221" style="color:#7a4a2a;text-decoration:none">(03) 9850 2221</a>
          &nbsp;·&nbsp;
          <a href="mailto:hello@bodyforme.com.au" style="color:#7a4a2a;text-decoration:none">hello@bodyforme.com.au</a>
        </div>
      </div>
    </div>
  </div>`
}

const RULE = `<div style="height:1px;background:#d8ccba;margin:32px 0"></div>`

// ── Templates ─────────────────────────────────────────────────────────────────

function buildEmail(template: Template, vars: Record<string, string>): { subject: string; html: string } {
  const first   = vars.firstName ?? 'there'
  const plan    = vars.planName  ?? 'membership'
  const portal  = vars.portalUrl ?? `${BASE}/app`
  const review  = vars.reviewUrl ?? 'https://g.page/r/bodyforme/review'
  const signup  = vars.signupUrl ?? `${BASE}/sign-up`
  const booking = vars.bookingUrl ?? `${BASE}/app/schedule`

  switch (template) {

    case 'welcome':
      return {
        subject: 'Your membership is active',
        html: wrap(
          eyebrow('Welcome to the studio') +
          heading('You\'re <em style="font-style:italic">in</em>.') +
          p(`Hi ${first},`) +
          p(`Your <strong>${plan}</strong> is now active — which means the mat, the heat and the whole timetable are yours. The hardest part is over; now all that's left is to show up.`) +
          detailBox([['Plan', plan], ['Status', 'Active']]) +
          p('New here? Arrive ten minutes early for your first class and we\'ll take care of the rest.') +
          cta('Browse timetable', booking) +
          signoff('See you on the mat,')
        ),
      }

    case 'payment-failed':
      return {
        subject: 'A problem with your payment',
        html: wrap(
          eyebrow('Action needed') +
          heading('A small hiccup<br>with your <em style="font-style:italic">payment</em>') +
          p(`Hi ${first},`) +
          p(`We had trouble processing your payment for your <strong>${plan}</strong> membership. It happens — often it's just an expired card or a bank declining an automatic charge.`) +
          detailBox([['Plan', plan], ['Next attempt', 'In 3 days']]) +
          p('To keep your bookings running without interruption, please take a moment to update your payment details.') +
          cta('Update payment details', portal) +
          RULE +
          p('Already sorted it, or think this is a mistake? Just reply to this email and we\'ll help you out.', true)
        ),
      }

    case 'review-request':
      return {
        subject: 'Would you mind leaving a review?',
        html: wrap(
          eyebrow('A small favour') +
          heading('How\'s your <em style="font-style:italic">practice</em> going?') +
          p(`Hi ${first},`) +
          p('We\'ve noticed you\'ve been coming in regularly lately — and honestly, it\'s made our week. There\'s nothing we love more than seeing someone settle into a rhythm.') +
          p('If BodyForme has been good to you, would you mind leaving a quick review? A couple of honest sentences goes a long way in helping other people find their way to the mat.') +
          cta('Leave a review on Google', review) +
          RULE +
          p('It takes about a minute, and it means the world to a small studio like ours. Thank you for being part of it.', true) +
          signoff('With gratitude,')
        ),
      }

    case 'reengagement-30':
      return {
        subject: 'We\'ve missed you',
        html: wrap(
          eyebrow('It\'s been a little while') +
          heading('We\'ve <em style="font-style:italic">missed</em> you') +
          p(`Hi ${first},`) +
          p('It\'s been about a month since your last class, and the studio\'s just a touch quieter without you. No pressure at all — life gets full, and the mat will always be here when you\'re ready to come back to it.') +
          p('Whenever you feel like easing back in, the heat is on and your spot is waiting. Even one slow, gentle class can be enough to find your way again.') +
          cta('Browse the schedule', booking) +
          signoff('Hope to see you soon,')
        ),
      }

    case 'reengagement-90':
      return {
        subject: 'Just checking in',
        html: wrap(
          eyebrow('A gentle check-in') +
          heading('Still <em style="font-style:italic">here</em><br>whenever you are') +
          p(`Hi ${first},`) +
          p('It\'s been a few months since we last saw you, so we wanted to check in — no agenda, just a friendly hello.') +
          p('Your membership is <strong>still active</strong> and ready whenever you\'d like to use it. Whether it\'s been a busy season, an injury, or simply life getting in the way, there\'s no wrong time to come back.') +
          cta('Book a class', booking) +
          RULE +
          p(`And if your needs have changed, we\'re happy to talk through pausing or adjusting your plan — just reply to this email.`, true) +
          signoff('Warmly,')
        ),
      }

    case 'migration':
      return {
        subject: 'Action needed: new booking system',
        html: wrap(
          eyebrow('Something new') +
          heading('We\'ve moved to a<br>new <em style="font-style:italic">booking system</em>') +
          p(`Hi ${first},`) +
          p('We\'ve upgraded to a brand-new booking system — faster, simpler, and far easier to use from your phone. It\'s a big step up from what you\'re used to with Mind Body.') +
          p('To keep booking your classes, you\'ll need to <strong>create a new account</strong>. It only takes a minute, and your membership and remaining credits carry over automatically.') +
          detailBox([['Step 1', 'Create your account'], ['Step 2', 'Confirm your details'], ['Step 3', 'Book as usual']]) +
          cta('Create account', signup) +
          p('Use the same email address you booked with on Mind Body and everything will link up. Need a hand? Just reply — we\'re happy to walk you through it.', true)
        ),
      }

    case 'dd-payment-setup':
      return {
        subject: 'One small thing to sort before your next class',
        html: wrap(
          eyebrow('Action needed') +
          heading('Nearly <em style="font-style:italic">there</em> — just one small thing') +
          p(`Hi ${first},`) +
          p(`Thanks for signing up to your <strong>${plan}</strong> with us — we're really glad to have you.`) +
          p('To get your direct debit running, we just need your BSB and account number. It takes about two minutes and is handled securely by Stripe — we never see your account details.') +
          cta('Set up direct debit', `${BASE}/app/setup-payment`) +
          RULE +
          p('Any questions? Just reply to this email or speak to Suzanne next time you\'re in.', true) +
          signoff('See you on the mat,')
        ),
      }

    case 'member-onboarding':
      return {
        subject: 'Your account is ready — here\'s how to get started',
        html: wrap(
          eyebrow('Welcome to the new system') +
          heading('Get set up in<br><em style="font-style:italic">three quick steps</em>') +
          p(`Hi ${first},`) +
          p('We\'ve moved to a new online booking system and member app. Getting up and running only takes a few minutes — here\'s everything you need.') +
          RULE +

          `<div style="margin:0 0 10px">
            <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#7a4a2a;margin-bottom:10px">Step 1 — Set up your password</div>
            <p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 12px">Your account is already set up — you just need to create a password to log in. Tap the button below, enter your email address, and we'll send you a link to set your password straight away.</p>
            ${cta('Create your password', `${BASE}/app/forgot-password`)}
            <p style="font-size:13px;line-height:1.6;color:#a08568;margin:8px 0 0">Use the same email address you've been booking classes with.</p>
          </div>` +
          RULE +

          `<div style="margin:0 0 10px">
            <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#7a4a2a;margin-bottom:10px">Step 2 — Add the app to your home screen</div>
            <p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 10px">The member app works right in your browser — no App Store needed. Save it to your home screen for quick access.</p>
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4ede1;border:1px solid #d8ccba;padding:20px 24px;margin:6px 0 16px">
              <tr>
                <td style="padding:0 16px 0 0;vertical-align:top;width:50%">
                  <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#a08568;margin-bottom:8px">On iPhone (Safari)</div>
                  <ol style="font-size:13px;line-height:1.8;color:#2a1506;margin:0;padding-left:18px">
                    <li>Open <strong>bodyforme.com.au/app</strong></li>
                    <li>Tap the <strong>Share</strong> button (box with arrow)</li>
                    <li>Tap <strong>Add to Home Screen</strong></li>
                    <li>Tap <strong>Add</strong></li>
                  </ol>
                </td>
                <td style="vertical-align:top;width:50%">
                  <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#a08568;margin-bottom:8px">On Android (Chrome)</div>
                  <ol style="font-size:13px;line-height:1.8;color:#2a1506;margin:0;padding-left:18px">
                    <li>Open <strong>bodyforme.com.au/app</strong></li>
                    <li>Tap the <strong>three-dot menu</strong> (top right)</li>
                    <li>Tap <strong>Add to Home screen</strong></li>
                    <li>Tap <strong>Add</strong></li>
                  </ol>
                </td>
              </tr>
            </table>
          </div>` +
          RULE +

          `<div style="margin:0 0 10px">
            <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#7a4a2a;margin-bottom:10px">Step 3 — Set up your direct debit <span style="font-size:10px;color:#a08568">(DD members only)</span></div>
            <p style="font-size:15px;line-height:1.72;color:#2a1506;margin:0 0 12px">If you're on a monthly membership, you'll need to add your BSB and account number so we can set up your direct debit. It takes two minutes and is handled securely by Stripe.</p>
            ${cta('Set up direct debit', `${BASE}/app/setup-payment`)}
          </div>` +
          RULE +

          p('Any questions? Just reply to this email or have a chat with Suzanne next time you\'re in.', true) +
          signoff('See you on the mat,')
        ),
      }

    case 'custom':
      return { subject: vars.subject ?? '(no subject)', html: vars.html ?? '' }
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const payload: EmailPayload = await req.json()
    const { to, template, vars } = payload

    if (!to || !template) {
      return NextResponse.json({ error: 'to and template are required' }, { status: 400 })
    }

    // 'custom' template sends arbitrary HTML — restrict to internal callers only
    if (template === 'custom') {
      const internalKey = req.headers.get('x-internal-key')
      const expected    = process.env.STRIPE_WEBHOOK_SECRET ?? ''
      if (!expected || internalKey !== expected) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const mergedVars = {
      ...(vars ?? {}),
      ...(template === 'custom' && payload.subject ? { subject: payload.subject } : {}),
      ...(template === 'custom' && payload.body    ? { html: payload.body.replace(/\n/g, '<br>') } : {}),
    }

    const { subject, html } = buildEmail(template, mergedVars)

    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
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
