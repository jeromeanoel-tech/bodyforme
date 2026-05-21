import { NextRequest, NextResponse } from 'next/server'
import { cancelBooking } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { bookingId } = await req.json()
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })

  await cancelBooking(bookingId, session.id)
  return NextResponse.json({ ok: true })
}
