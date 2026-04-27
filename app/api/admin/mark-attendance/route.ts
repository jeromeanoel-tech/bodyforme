import { NextRequest, NextResponse } from 'next/server'
import { markAttendance } from '@/lib/wix'

export async function POST(req: NextRequest) {
  try {
    const { bookingId, attended } = await req.json()
    if (!bookingId) return NextResponse.json({ error: 'bookingId required' }, { status: 400 })
    await markAttendance(bookingId, attended)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
