import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMemberByEmail, getContacts } from '@/lib/wix'
import { signSession, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/session'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const member = await getMemberByEmail(email.toLowerCase())
  if (!member) {
    return NextResponse.json({ error: 'No account found with that email' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, member.passwordHash)
  if (!valid) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Try to resolve Wix contact ID if not stored yet
  let wixContactId = member.wixContactId
  if (!wixContactId) {
    try {
      const contacts = await getContacts()
      const match = contacts.find(c => c.email.toLowerCase() === email.toLowerCase())
      if (match) wixContactId = match.id
    } catch { /* non-fatal */ }
  }

  const token = await signSession({
    id:           member._id,
    email:        member.email,
    firstName:    member.firstName,
    lastName:     member.lastName,
    wixContactId: wixContactId ?? '',
  })

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
  return res
}
