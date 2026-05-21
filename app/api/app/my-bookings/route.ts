import { NextRequest, NextResponse } from 'next/server'
import { getMemberBookingsForRange } from '@/lib/db'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'Missing from/to' }, { status: 400 })

  const bookings = await getMemberBookingsForRange(session.id, from, to)
  return NextResponse.json({ bookings })
}
