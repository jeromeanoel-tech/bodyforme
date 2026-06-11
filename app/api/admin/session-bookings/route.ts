import { NextRequest, NextResponse } from 'next/server'
import { getSessionBookings } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const eventId = req.nextUrl.searchParams.get('eventId')
  if (!eventId) return NextResponse.json({ error: 'Missing eventId' }, { status: 400 })

  const bookings = await getSessionBookings(eventId)
  return NextResponse.json({ bookings })
}
