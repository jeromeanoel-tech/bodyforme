import { getContactBookings } from '@/lib/wix'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('contactId')
  if (!contactId) return NextResponse.json({ bookings: [] })
  const bookings = await getContactBookings(contactId)
  return NextResponse.json({ bookings })
}
