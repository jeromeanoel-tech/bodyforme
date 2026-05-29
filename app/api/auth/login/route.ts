import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMemberByEmail } from '@/lib/db'
import { signSession, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/session'

export async function POST(req: NextRequest) {
  // Support both JSON (fetch) and form-encoded (HTML form)
  const ct = req.headers.get('content-type') ?? ''
  let email = '', password = '', redirect = false

  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData()
    email    = (form.get('email')    as string ?? '').toLowerCase().trim()
    password = form.get('password')  as string ?? ''
    redirect = true
  } else {
    const body = await req.json()
    email    = (body.email    ?? '').toLowerCase().trim()
    password = body.password  ?? ''
  }

  if (!email || !password) {
    if (redirect) return NextResponse.redirect(new URL('/app/login?error=missing', req.url))
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const member = await getMemberByEmail(email)
  const valid = member ? await bcrypt.compare(password, member.passwordHash) : false

  if (!member || !valid) {
    if (redirect) return NextResponse.redirect(new URL('/app/login?error=invalid', req.url))
    return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
  }

  const token = await signSession({
    id:           member._id,
    email:        member.email,
    firstName:    member.firstName,
    lastName:     member.lastName,
    wixContactId: '',
  })

  if (redirect) {
    const res = NextResponse.redirect(new URL('/app/schedule', req.url))
    res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
    return res
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
  return res
}
