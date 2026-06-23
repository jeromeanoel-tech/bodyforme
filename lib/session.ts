import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const getSecret = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is required')
  return new TextEncoder().encode(s)
}
const COOKIE  = 'bf_member'
const EXPIRY  = '7d'

export type SessionUser = {
  id:        string
  email:     string
  firstName: string
  lastName:  string
}

export async function signSession(user: SessionUser, expiry = EXPIRY): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = cookies()
  const token = (store as ReturnType<typeof cookies> & { get(name: string): { value: string } | undefined }).get(COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

export const COOKIE_NAME = COOKIE

export function cookieOptions(rememberMe = false) {
  return {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge:   rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24 * 7,
    path:     '/',
  }
}

// Keep for backwards compat with any existing callers
export const COOKIE_OPTIONS = cookieOptions(false)
