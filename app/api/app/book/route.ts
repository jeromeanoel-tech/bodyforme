import { NextRequest, NextResponse } from 'next/server'
import { createBooking, getMemberByContactId, getSessionById } from '@/lib/db'
import { emailBookingConfirmed } from '@/lib/email'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  // Block inactive members from booking
  const member = await getMemberByContactId(session.id)
  if (!member || member.status === 'inactive') {
    return NextResponse.json({ error: 'Your membership is not active. Please contact the studio.' }, { status: 403 })
  }

  // Verify session exists and hasn't been cancelled
  const sess = await getSessionById(sessionId)
  if (!sess) {
    return NextResponse.json({ error: 'Class not found.' }, { status: 404 })
  }
  if (sess.status === 'CANCELLED') {
    return NextResponse.json({ error: 'This class has been cancelled.' }, { status: 409 })
  }

  try {
    const bookingId = await createBooking(session.id, sessionId)

    // fire-and-forget confirmation email
    emailBookingConfirmed({
      to:             member.email,
      firstName:      member.firstName,
      className:      sess.title,
      startTime:      sess.start_time,
      instructorName: sess.instructor_name || undefined,
    }).catch(() => {})

    return NextResponse.json({ ok: true, bookingId })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === '23505') {
      return NextResponse.json({ error: 'Already booked' }, { status: 409 })
    }
    console.error('Book error:', err)
    return NextResponse.json({ error: 'Booking failed' }, { status: 500 })
  }
}
