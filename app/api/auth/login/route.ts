import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMemberByEmail } from '@/lib/db'
import { signSession, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const member = await getMemberByEmail(email.toLowerCase())
  const valid = member ? await bcrypt.compare(password, member.passwordHash) : false
  if (!member || !valid) {
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
  }

  const token = await signSession({
    id:           member._id,
    email:        member.email,
    firstName:    member.firstName,
    lastName:     member.lastName,
    wixContactId: '',
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
  return res
}
