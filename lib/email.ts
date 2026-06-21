const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'BodyForme Studio <hello@bodyforme.com.au>'
const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'

// ── Layout helpers ────────────────────────────────────────────────────────────

const HEADER = `
  <div style="padding:34px 48px 28px;border-bottom:1px solid #d8ccba">
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:30px;font-weight:500;color:#2a1506;letter-spacing:.01em">Bodyforme</span>
  </div>`

const FOOTER = `
  <div style="padding:28px 48px 36px;border-top:1px solid #d8ccba;background:#fdfaf6">
    <p style="font-size:12px;line-height:1.6;color:#a08568;margin:0 0 14px">
      <strong style="color:#2a1506;font-weight:600">BodyForme Pilates</strong> — 132 Ayr Street, Doncaster VIC 3108<br>
      (03) 9850 2221 · <a href="mailto:info@bodyforme.com.au" style="color:#7a4a2a;text-decoration:none">info@bodyforme.com.au</a>
    </p>
    <table cellpadding="0" cellspacing="0" border="0"><tr>
      <td style="padding-right:18px"><a href="${BASE}/app/schedule" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7a4a2a;text-decoration:none">Timetable</a></td>
      <td style="padding-right:18px"><a href="${BASE}/app" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7a4a2a;text-decoration:none">My Account</a></td>
      <td><a href="${BASE}/contact" style="font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#7a4a2a;text-decoration:none">Contact</a></td>
    </tr></table>
  </div>`

function wrap(body: string) {
  return `<div style="background:#f4ede1;padding:56px 24px 96px;font-family:'DM Sans',system-ui,sans-serif">
  <div style="width:100%;max-width:600px;margin:0 auto;background:#fdfaf6;border:1px solid #d8ccba;overflow:hidden">
    ${HEADER}
    <div style="padding:44px 48px 40px">${body}</div>
    ${FOOTER}
  </div>
</div>`
}

function eyebrow(t: string) {
  return `<div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#7a4a2a;margin-bottom:18px">${t}</div>`
}

function heading(h: string) {
  return `<h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:38px;font-weight:500;line-height:1.12;color:#2a1506;margin:0 0 24px">${h}</h1>`
}

function p(html: string, muted = false) {
  return `<p style="font-size:15px;line-height:1.72;color:${muted ? '#a08568' : '#2a1506'};margin:0 0 18px">${html}</p>`
}

function cta(label: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:#2a1506;color:#f4ede1;font-family:'DM Sans',system-ui,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;text-decoration:none;padding:15px 34px;margin:12px 0 8px">${label}</a>`
}

function detailBox(rows: [string, string][]) {
  const rowHtml = rows.map(([k, v], i) =>
    `<tr>
      <td style="padding:7px 0${i > 0 ? ';border-top:1px solid #d8ccba' : ''};font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#a08568;width:50%">${k}</td>
      <td style="padding:7px 0${i > 0 ? ';border-top:1px solid #d8ccba' : ''};font-size:14px;font-weight:500;color:#2a1506;text-align:right">${v}</td>
    </tr>`
  ).join('')
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4ede1;border:1px solid #d8ccba;padding:20px 24px;margin:6px 0 26px"><tbody>${rowHtml}</tbody></table>`
}

function signoff(line: string) {
  return `<div style="margin-top:28px;font-size:15px;line-height:1.7;color:#2a1506">
    ${line}<br>
    <span style="font-family:'Cormorant Garamond',Georgia,serif;font-style:italic;font-size:20px">The BodyForme team</span>
  </div>`
}

const RULE = `<div style="height:1px;background:#d8ccba;margin:32px 0"></div>`

// ── Send ──────────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.error('[email] RESEND_API_KEY is not set — email not sent:', subject)
    return
  }
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  }).catch((err) => console.error('[email] send failed to', to, ':', err))
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) }
  catch { return iso }
}

function fmtTime(iso: string) {
  try {
    const [, t] = iso.split('T')
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
  } catch { return iso }
}

// ── Transactional emails ──────────────────────────────────────────────────────

export async function emailBookingConfirmed(opts: {
  to: string; firstName: string; className: string; startTime: string; instructorName?: string
}) {
  const { to, firstName, className, startTime, instructorName } = opts
  const rows: [string, string][] = [
    ['Class', className],
    ['Date', fmtDate(startTime)],
    ['Time', fmtTime(startTime)],
  ]
  if (instructorName) rows.push(['Instructor', instructorName])

  await sendEmail(to, `Booking confirmed — ${className}`, wrap(
    eyebrow('Booking confirmed') +
    heading('You\'re <em style="font-style:italic">booked in</em>.') +
    p(`Hi ${firstName}, your spot is confirmed:`) +
    detailBox(rows) +
    p(`Need to cancel? You can manage your bookings anytime in the <a href="${BASE}/app/bookings" style="color:#7a4a2a;text-decoration:underline">member app</a>.`) +
    signoff('See you on the mat,')
  ))
}

export async function emailBookingCancelled(opts: {
  to: string; firstName: string; className: string; startTime: string
}) {
  const { to, firstName, className, startTime } = opts
  await sendEmail(to, `Booking cancelled — ${className}`, wrap(
    eyebrow('Booking cancelled') +
    heading('Your booking has<br>been <em style="font-style:italic">cancelled</em>.') +
    p(`Hi ${firstName},`) +
    p(`Your booking for <strong>${className}</strong> on ${fmtDate(startTime)} at ${fmtTime(startTime)} has been cancelled.`) +
    cta('Browse the schedule', `${BASE}/app/schedule`) +
    RULE +
    p('Changed your mind? Rebook anytime — your spot is yours when you\'re ready.', true)
  ))
}

export async function emailAdminPasswordReset(opts: {
  username: string; name: string; resetUrl: string
}) {
  const { username, name, resetUrl } = opts
  await sendEmail('info@bodyforme.com.au', `Admin password reset — ${username}`, wrap(
    eyebrow('Admin access') +
    heading('Password reset<br><em style="font-style:italic">requested</em>') +
    p(`Hi ${name},`) +
    p(`A password reset was requested for the admin account <strong>${username}</strong>. Click below to set a new password — the link is valid for 1 hour.`) +
    cta('Reset password', resetUrl) +
    RULE +
    p('If you didn\'t request this, you can safely ignore this email — your password won\'t change.', true)
  ))
}

export async function emailPasswordReset(opts: {
  to: string; firstName: string; resetUrl: string
}) {
  const { to, firstName, resetUrl } = opts
  await sendEmail(to, 'Reset your BodyForme password', wrap(
    eyebrow('Password reset') +
    heading('Reset your <em style="font-style:italic">password</em>') +
    p(`Hi ${firstName},`) +
    p('We received a request to reset your password. Click the button below — the link is valid for 1 hour.') +
    cta('Reset password', resetUrl) +
    RULE +
    p('If you didn\'t request this, you can safely ignore this email — your password won\'t change.', true)
  ))
}

export async function emailWelcome(opts: {
  to: string; firstName: string
}) {
  const { to, firstName } = opts
  await sendEmail(to, 'Welcome to BodyForme', wrap(
    eyebrow('Welcome to the studio') +
    heading('Good to have<br>you <em style="font-style:italic">here</em>.') +
    p(`Hi ${firstName},`) +
    p('Your account is set up — you can now browse the timetable, book classes and manage your membership from the member app.') +
    cta('Book your first class', `${BASE}/app/schedule`) +
    p(`<a href="${BASE}/app/install" style="color:#7a4a2a;text-decoration:underline">Install the app</a> on your home screen for one-tap access.`, true) +
    RULE +
    p(`Returning from Mind Body? Use <a href="${BASE}/app/forgot-password" style="color:#7a4a2a;text-decoration:underline">Forgot password</a> to set a new password and you\'ll be in.`, true) +
    signoff('See you on the mat,')
  ))
}

export async function emailWaitlistBooked(opts: {
  to: string; firstName: string; className: string; startTime: string
}) {
  const { to, firstName, className, startTime } = opts
  await sendEmail(to, `You're in — spot opened for ${className}`, wrap(
    eyebrow('Good news') +
    heading('A spot just<br><em style="font-style:italic">opened up</em> for you.') +
    p(`Hi ${firstName},`) +
    p('You were next on the waitlist and we\'ve automatically booked you in:') +
    detailBox([['Class', className], ['Date', fmtDate(startTime)], ['Time', fmtTime(startTime)]]) +
    p(`If you can no longer make it, please cancel in the <a href="${BASE}/app/bookings" style="color:#7a4a2a;text-decoration:underline">member app</a> so someone else can take your spot.`) +
    signoff('See you on the mat,')
  ))
}

export async function emailGoogleReview(opts: {
  to: string; firstName: string; reviewUrl: string
}) {
  const { to, firstName, reviewUrl } = opts
  await sendEmail(to, 'Would you mind leaving a review?', wrap(
    eyebrow('A small favour') +
    heading('How\'s your <em style="font-style:italic">practice</em> going?') +
    p(`Hi ${firstName},`) +
    p('We\'ve noticed you\'ve been coming in regularly — and honestly, it\'s made our week. There\'s nothing we love more than seeing someone settle into a rhythm.') +
    p('If BodyForme has been good to you, would you mind leaving a quick review? A couple of honest sentences goes a long way in helping other people find their way to the mat.') +
    cta('Leave a review on Google', reviewUrl) +
    RULE +
    p('Have feedback you\'d prefer to share directly? Just reply to this email — Suzanne reads every one.', true) +
    signoff('With gratitude,')
  ))
}

export async function emailRetention30(opts: {
  to: string; firstName: string
}) {
  const { to, firstName } = opts
  await sendEmail(to, 'We\'ve missed you', wrap(
    eyebrow('It\'s been a little while') +
    heading('We\'ve <em style="font-style:italic">missed</em> you') +
    p(`Hi ${firstName},`) +
    p('It\'s been about a month since your last class, and the studio\'s just a touch quieter without you. No pressure at all — life gets full, and the mat will always be here when you\'re ready.') +
    p('Whenever you feel like easing back in, the heat is on and your spot is waiting.') +
    cta('Browse the schedule', `${BASE}/app/schedule`) +
    signoff('Hope to see you soon,')
  ))
}

export async function emailRetention90(opts: {
  to: string; firstName: string
}) {
  const { to, firstName } = opts
  await sendEmail(to, 'Just checking in', wrap(
    eyebrow('A gentle check-in') +
    heading('Still <em style="font-style:italic">here</em><br>whenever you are') +
    p(`Hi ${firstName},`) +
    p('It\'s been a few months since we last saw you, so we wanted to check in — no agenda, just a friendly hello.') +
    p('Your membership is <strong>still active</strong> and ready whenever you\'d like to use it. There\'s no wrong time to come back.') +
    cta('Book a class', `${BASE}/app/schedule`) +
    RULE +
    p('If you\'d like to pause or have questions about your membership, just reply — we\'re always happy to chat.', true) +
    signoff('Warmly,')
  ))
}
