import { NextRequest, NextResponse } from 'next/server'
import { createBooking } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  try {
    const bookingId = await createBooking(session.id, sessionId)
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
