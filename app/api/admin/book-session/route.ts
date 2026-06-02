import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { markAttendance } from '@/lib/db'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function POST(req: NextRequest) {
  const { memberId, sessionId } = await req.json()
  if (!memberId || !sessionId) {
    return NextResponse.json({ error: 'memberId and sessionId required' }, { status: 400 })
  }

  // Upsert booking (idempotent — safe to call if they're already booked)
  const { data: booking, error } = await supabase
    .from('bookings')
    .upsert(
      { member_id: memberId, session_id: sessionId, status: 'CONFIRMED' },
      { onConflict: 'member_id,session_id' },
    )
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Mark as attended immediately
  await markAttendance(booking.id, true)

  // Return the booking in the same shape CheckInClient expects
  const { data: member } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, plan_override, credit_balance, status')
    .eq('id', memberId)
    .single()

  return NextResponse.json({
    booking: {
      id:     booking.id,
      status: 'CONFIRMED',
      contactDetails: {
        firstName: member?.first_name ?? '',
        lastName:  member?.last_name  ?? '',
        email:     member?.email      ?? '',
      },
      memberId:         memberId,
      planOverride:     member?.plan_override  ?? '',
      creditBalance:    Number(member?.credit_balance ?? 0),
      memberStatus:     member?.status         ?? '',
      classesRemaining: null,
    },
  })
}
