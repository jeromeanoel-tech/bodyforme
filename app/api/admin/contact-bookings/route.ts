import { getContactBookings } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('contactId')
  if (!contactId) return NextResponse.json({ bookings: [] })

  // Allow admin session (any contactId) or member session (own contactId only)
  const admin = await getAdminSession()
  if (!admin) {
    const member = await getSession()
    if (!member || member.id !== contactId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const bookings = await getContactBookings(contactId)
  return NextResponse.json({ bookings })
}
