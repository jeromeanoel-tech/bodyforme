import { NextRequest, NextResponse } from 'next/server'
import {
  cancelBooking,
  getBookingWithSession,
  getMemberByContactId,
  getFirstOnWaitlist,
  createBooking,
  leaveWaitlist,
  CREDIT_PLANS,
  countPendingBookings,
} from '@/lib/db'
import { getSession } from '@/lib/session'
import { emailBookingCancelled, emailWaitlistBooked } from '@/lib/email'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { bookingId } = await req.json()
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })

  // get session details before cancelling (for email + waitlist)
  const booking = await getBookingWithSession(bookingId, session.id)

  // Enforce late-cancellation window: no cancellations within 2 hours of class start
  if (booking?.start_time) {
    const cutoff = new Date(new Date(booking.start_time).getTime() - 2 * 60 * 60 * 1000)
    if (new Date() > cutoff) {
      return NextResponse.json(
        { error: 'Cancellations must be made at least 2 hours before the class starts.' },
        { status: 409 },
      )
    }
  }

  const cancelledMember = await getMemberByContactId(session.id)

  await cancelBooking(bookingId, session.id)

  // Send cancellation confirmation email
  if (booking && cancelledMember) {
    emailBookingCancelled({
      to:        cancelledMember.email,
      firstName: cancelledMember.firstName,
      className: booking.title,
      startTime: booking.start_time,
    }).catch(() => {})
  }

  if (booking) {
    // Promote next person off the waitlist and notify them
    ;(async () => {
      if (booking.start_time && new Date(booking.start_time) > new Date()) {
        const next = await getFirstOnWaitlist(booking.sessionId)
        if (next) {
          const nextMember = await getMemberByContactId(next.memberId)
          let eligible = false
          if (nextMember && nextMember.status !== 'inactive') {
            let ok = true
            if (nextMember.membershipEndDate) {
              const today = new Date(); today.setHours(0, 0, 0, 0)
              const end   = new Date(nextMember.membershipEndDate); end.setHours(0, 0, 0, 0)
              if (today > end) ok = false
            }
            if (ok) {
              const plan   = nextMember.planOverride.toLowerCase()
              const isPack = CREDIT_PLANS.some(p => plan.includes(p.toLowerCase()))
              if (isPack) {
                const pending = await countPendingBookings(next.memberId)
                if (nextMember.creditBalance - pending <= 0) ok = false
              }
            }
            eligible = ok
          }

          if (eligible) {
            try {
              const newBookingId = await createBooking(next.memberId, booking.sessionId)
              if (newBookingId) {
                await leaveWaitlist(next.memberId, booking.sessionId)
                emailWaitlistBooked({
                  to:        nextMember!.email,
                  firstName: nextMember!.firstName,
                  className: booking.title,
                  startTime: booking.start_time,
                }).catch(() => {})
              }
            } catch { /* booking failed — leave on waitlist */ }
          }
        }
      }
    })().catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
