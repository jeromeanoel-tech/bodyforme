import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { createClient } from '@supabase/supabase-js'
import { CREDIT_PLANS } from '@/lib/db'
import { emailBookingConfirmed } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { memberId, sessionId } = await req.json()
  if (!memberId || !sessionId) {
    return NextResponse.json({ error: 'memberId and sessionId required' }, { status: 400 })
  }

  // Verify member exists and is not inactive
  const { data: member } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, status, plan_override, credit_balance')
    .eq('id', memberId)
    .single()

  if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  if (member.status === 'inactive') {
    return NextResponse.json({ error: 'Member is inactive — they must renew before booking.' }, { status: 403 })
  }

  // Verify session exists and has capacity
  const { data: session } = await supabase
    .from('sessions')
    .select('id, title, start_time, end_time, capacity, status')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.status === 'CANCELLED') {
    return NextResponse.json({ error: 'This class has been cancelled.' }, { status: 409 })
  }

  // Count current bookings for capacity check
  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('status', 'CONFIRMED')

  if ((count ?? 0) >= session.capacity) {
    return NextResponse.json({ error: 'This class is full.' }, { status: 409 })
  }

  // Check for duplicate booking
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('member_id', memberId)
    .eq('session_id', sessionId)
    .single()

  if (existing?.id) {
    return NextResponse.json({ error: 'Member is already booked into this class.' }, { status: 409 })
  }

  // Create booking (no attendance mark — this is an advance booking)
  const { data: inserted, error } = await supabase
    .from('bookings')
    .insert({ member_id: memberId, session_id: sessionId, status: 'CONFIRMED' })
    .select('id')
    .single()

  if (error || !inserted) {
    return NextResponse.json({ error: error?.message ?? 'Booking failed' }, { status: 500 })
  }

  // Check if pack-plan member has sufficient credits and warn if not
  const plan    = (member.plan_override ?? '').toLowerCase()
  const isPack  = CREDIT_PLANS.some(p => plan.includes(p.toLowerCase()))
  const lowCredits = isPack && (member.credit_balance ?? 0) <= 0

  // Send booking confirmation to member (skip placeholder addresses)
  if (member.email && !member.email.includes('.placeholder')) {
    emailBookingConfirmed({
      to:        member.email,
      firstName: member.first_name ?? '',
      className: session.title,
      startTime: session.start_time,
    }).catch((err) => console.error('[advance-book] confirmation email failed', err))
  }

  return NextResponse.json({
    ok: true,
    lowCredits,
    booking: {
      id:       inserted.id,
      status:   'CONFIRMED',
      title:    session.title,
      start:    session.start_time,
      attended: false,
    },
  })
}
