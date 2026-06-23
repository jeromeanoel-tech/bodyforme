import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMemberByEmail, getAdminPasswordOverride } from '@/lib/db'
import { signSession, cookieOptions, COOKIE_NAME } from '@/lib/session'
import { signAdminSession, ADMIN_COOKIE, ADMIN_MAX_AGE } from '@/lib/adminSession'

type StaffRecord = { username: string; passwordHash: string; role: 'admin' | 'staff'; name: string }

function getStaff(): StaffRecord[] {
  try {
    return JSON.parse(process.env.ADMIN_CREDENTIALS ?? '[]') as StaffRecord[]
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get('content-type') ?? ''
  let credential = '', password = '', isForm = false, rememberMe = false

  if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
    const form = await req.formData()
    credential = (form.get('email') as string ?? '').toLowerCase().trim()
    password   = form.get('password') as string ?? ''
    isForm     = true
  } else {
    const body = await req.json()
    credential  = (body.email ?? '').toLowerCase().trim()
    password    = body.password ?? ''
    rememberMe  = !!body.rememberMe
  }

  if (!credential || !password) {
    if (isForm) return NextResponse.redirect(new URL('/app/login?error=missing', req.url))
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  // 1. Try member auth first (by email)
  const member = await getMemberByEmail(credential)
  if (member) {
    const valid = await bcrypt.compare(password, member.passwordHash)
    if (!valid) {
      if (isForm) return NextResponse.redirect(new URL('/app/login?error=invalid', req.url))
      return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
    }
    const token = await signSession({
      id:        member._id,
      email:     member.email,
      firstName: member.firstName,
      lastName:  member.lastName,
    }, rememberMe ? '30d' : '7d')
    const opts = cookieOptions(rememberMe)
    if (isForm) {
      const res = NextResponse.redirect(new URL('/app/schedule', req.url))
      res.cookies.set(COOKIE_NAME, token, opts)
      return res
    }
    const res = NextResponse.json({ ok: true, redirect: '/app/schedule' })
    res.cookies.set(COOKIE_NAME, token, opts)
    return res
  }

  // 2. Try admin auth — treat the credential as a username
  const staff = getStaff()
  const user  = staff.find(s => s.username === credential)
  if (user) {
    const overrideHash = await getAdminPasswordOverride(user.username).catch(() => null)
    const hashToCheck  = overrideHash ?? user.passwordHash
    if (await bcrypt.compare(password, hashToCheck)) {
      const token = await signAdminSession({ username: user.username, name: user.name, role: user.role })
      const cookieOpts = {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        maxAge:   ADMIN_MAX_AGE,
        path:     '/',
      }
      if (isForm) {
        const res = NextResponse.redirect(new URL('/admin', req.url))
        res.cookies.set(ADMIN_COOKIE, token, cookieOpts)
        return res
      }
      const res = NextResponse.json({ ok: true, redirect: '/admin' })
      res.cookies.set(ADMIN_COOKIE, token, cookieOpts)
      return res
    }
  }

  // Both failed
  if (isForm) return NextResponse.redirect(new URL('/app/login?error=invalid', req.url))
  return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 })
}
