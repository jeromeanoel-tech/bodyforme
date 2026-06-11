import { NextRequest, NextResponse } from 'next/server'
import { getSessions } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

export async function GET(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const from = req.nextUrl.searchParams.get('from')
  const to   = req.nextUrl.searchParams.get('to')
  if (!from || !to) return NextResponse.json({ error: 'from and to required' }, { status: 400 })
  const sessions = await getSessions(from, to)
  return NextResponse.json({ sessions })
}
