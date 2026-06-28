import { NextRequest, NextResponse } from 'next/server'
import { createBooking, getMemberByContactId, getSessionById, CREDIT_PLANS, countPendingBookings } from '@/lib/db'
import { getSession } from '@/lib/session'
import { broadcastBookingChanged } from '@/lib/broadcast'

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

  // Block members with no active plan and no credits remaining
  if (!member.planOverride && member.creditBalance <= 0) {
    return NextResponse.json({ error: 'You don\'t have an active membership. Please contact the studio to get started.' }, { status: 403 })
  }

  const plan       = member.planOverride.toLowerCase()
  // Treat members with no plan name as credit-based (MindBody imports without plan mapping)
  const isPackPlan = !member.planOverride || CREDIT_PLANS.some(p => plan.includes(p.toLowerCase()))

  // Block if a PREPAID membership has expired.
  // BECS subscription members (3/4/unlimited per week, monthly unlimited) are gated only by
  // members.status — the Stripe webhook sets that to 'inactive' when cancelled.
  // Applying end_date to subscriptions incorrectly blocks them during the 2–3 day BECS
  // settlement window (between billing period end and invoice.paid firing).
  if (member.membershipEndDate) {
    const PREPAID_KEYS = ['7-day', '3 month unlimited', '6 month unlimited', '1 year unlimited']
    const isPrepaidPlan = PREPAID_KEYS.some(k => plan.includes(k))
    if (isPrepaidPlan) {
      const todayMelb = new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(new Date())
      if (todayMelb > member.membershipEndDate) {
        return NextResponse.json({ error: 'Your membership has expired. Please contact the studio to renew.' }, { status: 403 })
      }
    }
  }

  // Block if on a credit-based plan with insufficient credits.
  // We count pending upcoming bookings (not yet attended) as "reserved" credits
  // so a member can't book more classes than their balance.
  if (isPackPlan) {
    const pending         = await countPendingBookings(session.id)
    const availableCredits = member.creditBalance - pending
    if (availableCredits <= 0) {
      return NextResponse.json({
        error: member.creditBalance <= 0
          ? 'You have no classes remaining. Please purchase a new pack to continue booking.'
          : 'All your remaining classes are already booked. Cancel an upcoming class to book a different one.',
      }, { status: 403 })
    }
  }

  // Verify session exists, not cancelled, and not full
  const sess = await getSessionById(sessionId)
  if (!sess) {
    return NextResponse.json({ error: 'Class not found.' }, { status: 404 })
  }
  if (new Date(sess.start_time) < new Date()) {
    return NextResponse.json({ error: 'This class has already started.' }, { status: 409 })
  }
  if (sess.status === 'CANCELLED') {
    return NextResponse.json({ error: 'This class has been cancelled.' }, { status: 409 })
  }
  if (sess.bookedCount >= sess.capacity) {
    return NextResponse.json({ error: 'This class is now full. Join the waitlist to be notified if a spot opens.' }, { status: 409 })
  }

  try {
    const bookingId = await createBooking(session.id, sessionId)

    broadcastBookingChanged(sessionId, 1).catch(() => {})

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
