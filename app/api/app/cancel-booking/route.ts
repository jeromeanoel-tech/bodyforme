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
import { broadcastBookingChanged } from '@/lib/broadcast'

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

  await cancelBooking(bookingId, session.id)

  // Notify other members immediately that a spot opened
  if (booking) broadcastBookingChanged(booking.sessionId, -1).catch(() => {})

  if (booking) {
    // Promote next person off the waitlist
    ;(async () => {
      if (booking.start_time && new Date(booking.start_time) > new Date()) {
        const next = await getFirstOnWaitlist(booking.sessionId)
        if (next) {
          const nextMember = await getMemberByContactId(next.memberId)
          let eligible = false
          if (nextMember && nextMember.status !== 'inactive') {
            let ok = true
            if (nextMember.membershipEndDate) {
              const PREPAID_KEYS = ['7-day', '3 month unlimited', '6 month unlimited', '1 year unlimited']
              const wlPlan = nextMember.planOverride.toLowerCase()
              if (PREPAID_KEYS.some(k => wlPlan.includes(k))) {
                const todayMelb = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(new Date())
                if (todayMelb > nextMember.membershipEndDate) ok = false
              }
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
                broadcastBookingChanged(booking.sessionId, 1).catch(() => {})
              }
            } catch { /* booking failed — leave on waitlist */ }
          }
        }
      }
    })().catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
