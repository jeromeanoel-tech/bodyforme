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
