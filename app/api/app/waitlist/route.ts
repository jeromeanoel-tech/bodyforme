import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { joinWaitlist, leaveWaitlist, getMemberWaitlistInRange } from '@/lib/db'
import { getSession } from '@/lib/session'


// GET /api/app/waitlist?from=...&to=...  → list of session IDs the member is waiting on
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const from = req.nextUrl.searchParams.get('from') ?? ''
  const to   = req.nextUrl.searchParams.get('to')   ?? ''
  const ids  = await getMemberWaitlistInRange(session.id, from, to)
  return NextResponse.json({ sessionIds: ids })
}

// POST /api/app/waitlist  body: { sessionId }  → join waitlist
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  // Prevent joining waitlist for a class already confirmed-booked
  const { data: existing } = await supabase
    .from('bookings')
    .select('id')
    .eq('member_id', session.id)
    .eq('session_id', sessionId)
    .eq('status', 'CONFIRMED')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'You already have a confirmed booking for this class.' }, { status: 409 })
  }

  await joinWaitlist(session.id, sessionId)
  return NextResponse.json({ ok: true })
}

// DELETE /api/app/waitlist  body: { sessionId }  → leave waitlist
export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  await leaveWaitlist(session.id, sessionId)
  return NextResponse.json({ ok: true })
}
