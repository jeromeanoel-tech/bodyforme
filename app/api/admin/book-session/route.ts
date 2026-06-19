import { NextRequest, NextResponse } from 'next/server'
import { markAttendance } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { memberId, sessionId } = await req.json()
  if (!memberId || !sessionId) {
    return NextResponse.json({ error: 'memberId and sessionId required' }, { status: 400 })
  }

  // Block inactive members — they must pay before being checked in
  const { data: memberCheck } = await supabase
    .from('members')
    .select('status')
    .eq('id', memberId)
    .single()

  if (memberCheck?.status === 'inactive') {
    return NextResponse.json({ error: 'Membership inactive — member must renew before check-in.' }, { status: 403 })
  }

  // Check if booking already exists (avoids relying on a named unique constraint)
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('member_id', memberId)
    .eq('session_id', sessionId)
    .single()

  let bookingId: string

  if (existing?.id) {
    bookingId = existing.id
  } else {
    const { data: inserted, error } = await supabase
      .from('bookings')
      .insert({ member_id: memberId, session_id: sessionId, status: 'CONFIRMED' })
      .select('id')
      .single()

    if (error || !inserted) {
      return NextResponse.json({ error: error?.message ?? 'Failed to create booking' }, { status: 500 })
    }
    bookingId = inserted.id
  }

  // Mark as attended immediately
  await markAttendance(bookingId, true)

  // Return the booking in the shape CheckInClient expects
  const { data: member } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, plan_override, credit_balance, status')
    .eq('id', memberId)
    .single()

  return NextResponse.json({
    booking: {
      id:     bookingId,
      status: 'CONFIRMED',
      attended: true,
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
