const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'BodyForme Studio <hello@bodyforme.com.au>'

function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-AU', {
      weekday: 'long', day: 'numeric', month: 'long',
    })
  } catch { return iso }
}

function fmtTime(iso: string) {
  try {
    const [, t] = iso.split('T')
    if (!t) return ''
    const [h, m] = t.split(':').map(Number)
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
  } catch { return iso }
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  }).catch(() => {})
}

const FOOTER = `
  <hr style="margin:24px 0;border:none;border-top:1px solid #d8ccba">
  <p style="font-size:12px;color:#a08568;margin:0">
    <strong style="color:#2a1506">BodyForme Pilates</strong><br>
    132 Ayr Street, Doncaster VIC 3108
  </p>
`

function classBlock(className: string, startTime: string, instructorName?: string) {
  return `
    <table style="margin:16px 0;border-left:3px solid #7a4a2a;padding-left:14px;border-collapse:collapse">
      <tr><td style="color:#a08568;font-size:12px;padding:3px 16px 3px 0;white-space:nowrap">Class</td><td style="font-weight:600;color:#2a1506">${className}</td></tr>
      <tr><td style="color:#a08568;font-size:12px;padding:3px 16px 3px 0">Date</td><td style="color:#2a1506">${fmtDate(startTime)}</td></tr>
      <tr><td style="color:#a08568;font-size:12px;padding:3px 16px 3px 0">Time</td><td style="color:#2a1506">${fmtTime(startTime)}</td></tr>
      ${instructorName ? `<tr><td style="color:#a08568;font-size:12px;padding:3px 16px 3px 0">Instructor</td><td style="color:#2a1506">${instructorName}</td></tr>` : ''}
    </table>
  `
}

export async function emailBookingConfirmed(opts: {
  to: string; firstName: string; className: string; startTime: string; instructorName?: string
}) {
  const { to, firstName, className, startTime, instructorName } = opts
  await sendEmail(to, `Booking confirmed — ${className}`, `
    <p style="color:#2a1506">Hi ${firstName},</p>
    <p style="color:#2a1506">Your booking is confirmed:</p>
    ${classBlock(className, startTime, instructorName)}
    <p style="color:#2a1506">Need to cancel? Manage your bookings in the <a href="https://bodyforme.com.au/app/bookings" style="color:#7a4a2a">BodyForme app</a>.</p>
    <p style="color:#2a1506">See you on the mat!</p>
    ${FOOTER}
  `)
}

export async function emailBookingCancelled(opts: {
  to: string; firstName: string; className: string; startTime: string
}) {
  const { to, firstName, className, startTime } = opts
  await sendEmail(to, `Booking cancelled — ${className}`, `
    <p style="color:#2a1506">Hi ${firstName},</p>
    <p style="color:#2a1506">Your booking for <strong>${className}</strong> on ${fmtDate(startTime)} at ${fmtTime(startTime)} has been cancelled.</p>
    <p><a href="https://bodyforme.com.au/app/schedule" style="color:#7a4a2a">Browse the schedule →</a></p>
    ${FOOTER}
  `)
}

export async function emailPasswordReset(opts: {
  to: string; firstName: string; resetUrl: string
}) {
  const { to, firstName, resetUrl } = opts
  await sendEmail(to, 'Reset your BodyForme password', `
    <p style="color:#2a1506">Hi ${firstName},</p>
    <p style="color:#2a1506">We received a request to reset your password. Click the button below — the link is valid for 1 hour.</p>
    <p style="margin:28px 0">
      <a href="${resetUrl}" style="background:#2a1506;color:#f4ede1;padding:13px 28px;text-decoration:none;font-family:'DM Sans',system-ui,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;display:inline-block">
        Reset password
      </a>
    </p>
    <p style="color:#a08568;font-size:13px">If you didn&apos;t request this, you can safely ignore this email — your password won&apos;t change.</p>
    ${FOOTER}
  `)
}

export async function emailWelcome(opts: {
  to: string; firstName: string
}) {
  const { to, firstName } = opts
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'
  await sendEmail(to, 'Welcome to BodyForme', `
    <p style="color:#2a1506">Hi ${firstName},</p>
    <p style="color:#2a1506">Welcome to BodyForme — we&apos;re so glad you&apos;re here.</p>
    <p style="color:#2a1506">You can book classes, manage your membership and track your attendance through the member app. We recommend saving it to your home screen so it&apos;s always one tap away.</p>

    <table style="margin:28px 0;border-collapse:collapse">
      <tr>
        <td style="padding-right:12px">
          <a href="${base}/app/schedule" style="background:#2a1506;color:#f4ede1;padding:13px 28px;text-decoration:none;font-family:'DM Sans',system-ui,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;display:inline-block">
            Book your first class
          </a>
        </td>
        <td>
          <a href="${base}/app/install" style="background:transparent;color:#7a4a2a;padding:13px 20px;text-decoration:none;font-family:'DM Sans',system-ui,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;display:inline-block;border:1px solid #d8ccba">
            Install the app
          </a>
        </td>
      </tr>
    </table>

    <p style="color:#a08568;font-size:13px">
      If you&apos;re a returning member from Mind Body, your account has been set up — just use <a href="${base}/app/forgot-password" style="color:#7a4a2a">Forgot password</a> to choose a new password and you&apos;ll be in.
    </p>
    <p style="color:#2a1506">See you on the mat!</p>
    ${FOOTER}
  `)
}

export async function emailWaitlistBooked(opts: {
  to: string; firstName: string; className: string; startTime: string
}) {
  const { to, firstName, className, startTime } = opts
  await sendEmail(to, `You're in — spot opened for ${className}`, `
    <p style="color:#2a1506">Hi ${firstName},</p>
    <p style="color:#2a1506">Good news! A spot has opened up and we've automatically booked you in:</p>
    ${classBlock(className, startTime)}
    <p style="color:#2a1506">If you can no longer make it, please cancel in the <a href="https://bodyforme.com.au/app/bookings" style="color:#7a4a2a">BodyForme app</a> so someone else can take your spot.</p>
    <p style="color:#2a1506">See you on the mat!</p>
    ${FOOTER}
  `)
}

export async function emailGoogleReview(opts: {
  to: string; firstName: string; reviewUrl: string
}) {
  const { to, firstName, reviewUrl } = opts
  await sendEmail(to, 'Enjoying BodyForme? We’d love your feedback', `
    <p style="color:#2a1506">Hi ${firstName},</p>
    <p style="color:#2a1506">Thank you for being part of the BodyForme community &mdash; it means a lot to us.</p>
    <p style="color:#2a1506">If you&apos;ve been enjoying your classes, we&apos;d be so grateful if you could take a moment to leave us a Google review. It only takes a minute and genuinely helps other people in Doncaster find us.</p>

    <p style="margin:28px 0">
      <a href="${reviewUrl}" style="background:#2a1506;color:#f4ede1;padding:13px 28px;text-decoration:none;font-family:'DM Sans',system-ui,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;display:inline-block">
        Leave a review
      </a>
    </p>

    <p style="color:#a08568;font-size:13px">
      Have feedback you&apos;d prefer to share directly? Just reply to this email &mdash; Suzanne reads every one.
    </p>
    <p style="color:#2a1506">See you on the mat!</p>
    ${FOOTER}
  `)
}

export async function emailRetention30(opts: {
  to: string; firstName: string
}) {
  const { to, firstName } = opts
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'
  await sendEmail(to, 'We’ve missed you at BodyForme', `
    <p style="color:#2a1506">Hi ${firstName},</p>
    <p style="color:#2a1506">It&apos;s been a little while since we&apos;ve seen you on the mat &mdash; we&apos;ve missed you.</p>
    <p style="color:#2a1506">Life gets busy, and we get it. But whenever you&apos;re ready, your spot is here. Classes are running every day, and we&apos;d love to have you back.</p>

    <p style="margin:28px 0">
      <a href="${base}/app/schedule" style="background:#2a1506;color:#f4ede1;padding:13px 28px;text-decoration:none;font-family:'DM Sans',system-ui,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;display:inline-block">
        Browse the schedule
      </a>
    </p>

    <p style="color:#a08568;font-size:13px">
      If anything has come up &mdash; injury, schedule change, or something else &mdash; feel free to reply and let us know. We&apos;re happy to help.
    </p>
    <p style="color:#2a1506">Hope to see you soon.</p>
    ${FOOTER}
  `)
}

export async function emailRetention90(opts: {
  to: string; firstName: string
}) {
  const { to, firstName } = opts
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'
  await sendEmail(to, 'Your BodyForme membership is still active', `
    <p style="color:#2a1506">Hi ${firstName},</p>
    <p style="color:#2a1506">We noticed it&apos;s been a while since your last class &mdash; about 3 months &mdash; and we wanted to check in.</p>
    <p style="color:#2a1506">Your membership is still active and your spot is waiting. Whether you want to ease back in with something gentle or dive straight back into the heat, we&apos;ve got a class for you.</p>

    <p style="margin:28px 0">
      <a href="${base}/app/schedule" style="background:#2a1506;color:#f4ede1;padding:13px 28px;text-decoration:none;font-family:'DM Sans',system-ui,sans-serif;font-size:11px;font-weight:500;letter-spacing:.14em;text-transform:uppercase;display:inline-block">
        Book a class
      </a>
    </p>

    <p style="color:#a08568;font-size:13px">
      If you&apos;d like to pause or have questions about your membership, just reply to this email or visit us at the studio &mdash; we&apos;re always happy to chat.
    </p>
    <p style="color:#2a1506">We&apos;d love to have you back.</p>
    ${FOOTER}
  `)
}
