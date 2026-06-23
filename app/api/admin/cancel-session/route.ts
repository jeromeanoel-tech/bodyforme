import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/adminSession'
import { CREDIT_PLANS } from '@/lib/db'
import { emailBookingCancelled } from '@/lib/email'
import { broadcastSessionCancelled } from '@/lib/broadcast'


export async function POST(req: NextRequest) {
  const adminSession = await getAdminSession()
  if (!adminSession || adminSession.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { sessionId } = await req.json() as { sessionId: string }
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  // Fetch session title/time for notification emails before cancelling
  const { data: sess } = await supabase
    .from('sessions')
    .select('title, start_time, status')
    .eq('id', sessionId)
    .single()

  if (!sess) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (sess.status === 'CANCELLED') return NextResponse.json({ ok: true, cancelledBookings: 0, alreadyCancelled: true })

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'CANCELLED' })
    .eq('id', sessionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fetch all confirmed bookings with member info
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, member_id, members(email, first_name, plan_override, credit_balance)')
    .eq('session_id', sessionId)
    .eq('status', 'CONFIRMED')

  if (bookings && bookings.length > 0) {
    // Cancel all bookings in one query
    await supabase
      .from('bookings')
      .update({ status: 'CANCELLED' })
      .eq('session_id', sessionId)
      .eq('status', 'CONFIRMED')

    // Restore credits and email each member
    for (const b of bookings) {
      const m = (b as any).members
      if (!m) continue

      // Restore one credit for pack-plan members — re-fetch balance to avoid stale-read race
      const plan   = (m.plan_override ?? '').toLowerCase()
      const isPack = CREDIT_PLANS.some(p => plan.includes(p.toLowerCase()))
      if (isPack) {
        const { data: fresh } = await supabase.from('members').select('credit_balance').eq('id', b.member_id).single()
        if (fresh && typeof fresh.credit_balance === 'number') {
          await supabase
            .from('members')
            .update({ credit_balance: fresh.credit_balance + 1 })
            .eq('id', b.member_id)
        }
      }

      // Email member — skip placeholder addresses
      if (m.email && !m.email.includes('.placeholder')) {
        emailBookingCancelled({
          to:        m.email,
          firstName: m.first_name ?? '',
          className: sess.title ?? 'your class',
          startTime: sess.start_time ?? '',
        }).catch((err) => console.error('[cancel-session] email failed for', m.email, err))
      }
    }
  }

  // Clear waitlist — no point keeping entries for a cancelled session
  await supabase.from('waitlist').delete().eq('session_id', sessionId)

  broadcastSessionCancelled(sessionId).catch(() => {})

  revalidatePath('/classes')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/checkin')

  return NextResponse.json({ ok: true, cancelledBookings: bookings?.length ?? 0 })
}
