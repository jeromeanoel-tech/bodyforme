import { NextRequest, NextResponse } from 'next/server'
import { getMemberByEmail } from '@/lib/db'

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })
  const member = await getMemberByEmail(email)
  if (!member) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json({ id: member._id, email: member.email, status: member.status })
}
