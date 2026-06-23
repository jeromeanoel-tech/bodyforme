import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { markAttendance } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'


const BASE = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'
const RESEND_API_KEY = process.env.RESEND_API_KEY

async function sendRenewalNudge(to: string, firstName: string) {
  if (!RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from:    'BodyForme Studio <hello@bodyforme.com.au>',
      to,
      subject: 'Your membership needs renewing',
      html: `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 24px">
        <p style="font-size:13px;color:#a08568;letter-spacing:.1em;text-transform:uppercase;margin:0 0 8px">Membership update</p>
        <h1 style="font-family:Georgia,serif;font-size:28px;color:#2a1506;margin:0 0 20px">Hi ${firstName}, your membership needs renewing</h1>
        <p style="font-size:15px;color:#2a1506;line-height:1.7;margin:0 0 24px">We noticed you attended a class today but your membership is no longer active. Head to the member app to renew and keep your classes uninterrupted.</p>
        <a href="${BASE}/app/membership" style="display:inline-block;background:#2a1506;color:#f4ede1;font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;padding:14px 28px;text-decoration:none">Renew membership</a>
        <p style="font-size:12px;color:#a08568;margin-top:32px">Questions? Reply to this email or call us at the studio.</p>
      </div>`,
    }),
  }).catch(() => {})
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  try {
    const { bookingId, attended } = await req.json()
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })

    await markAttendance(bookingId, attended)

    // If checking someone IN, check whether their membership is expired
    if (attended) {
      const { data } = await supabase
        .from('bookings')
        .select('member_id, members(email, first_name, status, end_date, plan_override)')
        .eq('id', bookingId)
        .single()

      if (data) {
        const m = (data as any).members
        if (m) {
          const isInactive  = m.status === 'inactive'
          const isPastEnd   = m.end_date ? new Date(m.end_date) < new Date() : false
          const hasNoPlan   = !m.plan_override

          if (isInactive || isPastEnd || hasNoPlan) {
            sendRenewalNudge(m.email, m.first_name).catch(() => {})
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
