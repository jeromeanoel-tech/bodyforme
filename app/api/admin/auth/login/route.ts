import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signAdminSession, ADMIN_COOKIE, ADMIN_MAX_AGE } from '@/lib/adminSession'
import { getAdminPasswordOverride } from '@/lib/db'

type StaffRecord = { username: string; passwordHash: string; role: 'admin' | 'staff'; name: string }

function getStaff(): StaffRecord[] {
  try {
    return JSON.parse(process.env.ADMIN_CREDENTIALS ?? '[]') as StaffRecord[]
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const { username, password } = await req.json() as { username: string; password: string }

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const staff = getStaff()
  const user  = staff.find(s => s.username === username.toLowerCase().trim())
  if (!user) return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })

  // Check for a password override (set via forgot-password flow) before falling back to env var hash
  const overrideHash = await getAdminPasswordOverride(user.username).catch(() => null)
  const hashToCheck  = overrideHash ?? user.passwordHash

  if (!(await bcrypt.compare(password, hashToCheck))) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 })
  }

  const token = await signAdminSession({ username: user.username, name: user.name, role: user.role })

  const res = NextResponse.json({ ok: true, role: user.role, name: user.name })
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   ADMIN_MAX_AGE,
    path:     '/',
  })
  return res
}
