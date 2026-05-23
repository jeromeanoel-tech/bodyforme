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
