import { NextRequest, NextResponse } from 'next/server'
import { getSessionBookings } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  const bookings = await getSessionBookings(eventId)
  return NextResponse.json({ bookings })
}
