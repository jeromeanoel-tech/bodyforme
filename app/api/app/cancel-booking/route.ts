import { NextRequest, NextResponse } from 'next/server'
import {
  cancelBooking,
  getBookingWithSession,
  getMemberByContactId,
  getFirstOnWaitlist,
  createBooking,
  leaveWaitlist,
} from '@/lib/db'
import { emailBookingCancelled, emailWaitlistBooked } from '@/lib/email'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { bookingId } = await req.json()
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })

  // get session details before cancelling (for email + waitlist)
  const booking = await getBookingWithSession(bookingId, session.id)

  await cancelBooking(bookingId, session.id)

  if (booking) {
    // fire-and-forget: send cancellation email + promote from waitlist
    ;(async () => {
      const member = await getMemberByContactId(session.id)
      if (member) {
        emailBookingCancelled({
          to:        member.email,
          firstName: member.firstName,
          className: booking.title,
          startTime: booking.start_time,
        }).catch(() => {})
      }

      // only promote if session is in the future
      if (booking.start_time && new Date(booking.start_time) > new Date()) {
        const next = await getFirstOnWaitlist(booking.sessionId)
        if (next) {
          try {
            const newBookingId = await createBooking(next.memberId, booking.sessionId)
            if (newBookingId) {
              await leaveWaitlist(next.memberId, booking.sessionId)
              emailWaitlistBooked({
                to:        next.email,
                firstName: next.firstName,
                className: booking.title,
                startTime: booking.start_time,
              }).catch(() => {})
            }
          } catch { /* booking failed — leave on waitlist */ }
        }
      }
    })().catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
