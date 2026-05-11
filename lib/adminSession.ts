import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export type AdminUser = {
  username: string
  name:     string
  role:     'admin' | 'staff'
}

export const ADMIN_COOKIE = 'bf_admin'
export const ADMIN_MAX_AGE = 60 * 60 * 8  // 8 hours

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-secret-change-me')

export async function signAdminSession(user: AdminUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_MAX_AGE}s`)
    .sign(secret())
}

export async function getAdminSession(): Promise<AdminUser | null> {
  try {
    const store = cookies()
    // Next.js 14 cookies() can be sync or async depending on context
    const resolved = typeof (store as unknown as Promise<unknown>).then === 'function'
      ? await (store as unknown as Promise<typeof store>)
      : store
    const token = resolved.get(ADMIN_COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, secret())
    return payload as unknown as AdminUser
  } catch {
    return null
  }
}
