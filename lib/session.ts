import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET  = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-secret-do-not-use-in-production'
)
const COOKIE  = 'bf_member'
const EXPIRY  = '7d'

export type SessionUser = {
  id:           string   // MemberCredentials item _id
  email:        string
  firstName:    string
  lastName:     string
  wixContactId: string
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(SECRET)
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
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
export const COOKIE_OPTIONS = {
  httpOnly:  true,
  secure:    process.env.NODE_ENV === 'production',
  sameSite:  'lax'  as const,
  maxAge:    60 * 60 * 24 * 7,
  path:      '/',
}
