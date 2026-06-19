import { NextRequest, NextResponse } from 'next/server'
import {
  cancelBooking,
  getBookingWithSession,
  getMemberByContactId,
  getFirstOnWaitlist,
  createBooking,
  leaveWaitlist,
  CREDIT_PLANS,
} from '@/lib/db'
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
    // Promote next person off the waitlist (no email sent)
    ;(async () => {
      if (booking.start_time && new Date(booking.start_time) > new Date()) {
        const next = await getFirstOnWaitlist(booking.sessionId)
        if (next) {
          const nextMember = await getMemberByContactId(next.memberId)
          const eligible = nextMember &&
            nextMember.status !== 'inactive' &&
            (() => {
              if (nextMember.membershipEndDate) {
                const today = new Date(); today.setHours(0, 0, 0, 0)
                const end   = new Date(nextMember.membershipEndDate); end.setHours(0, 0, 0, 0)
                if (today > end) return false
              }
              const plan = nextMember.planOverride.toLowerCase()
              const isPack = CREDIT_PLANS.some(p => plan.includes(p.toLowerCase()))
              if (isPack && nextMember.creditBalance <= 0) return false
              return true
            })()

          if (eligible) {
            try {
              const newBookingId = await createBooking(next.memberId, booking.sessionId)
              if (newBookingId) await leaveWaitlist(next.memberId, booking.sessionId)
            } catch { /* booking failed — leave on waitlist */ }
          }
        }
      }
    })().catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
