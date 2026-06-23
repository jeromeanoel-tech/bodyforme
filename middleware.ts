import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = () => {
  const s = process.env.JWT_SECRET
  if (!s) throw new Error('JWT_SECRET is not configured')
  return new TextEncoder().encode(s)
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin protection ──────────────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login') && !pathname.startsWith('/admin/forgot-password') && !pathname.startsWith('/admin/reset-password')) {
    const token = req.cookies.get('bf_admin')?.value
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url))
    try {
      await jwtVerify(token, SECRET())
    } catch {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }

  // ── Member app protection ─────────────────────────────────────────────────
  if (pathname.startsWith('/app') && !pathname.startsWith('/app/login') && !pathname.startsWith('/app/install') && !pathname.startsWith('/app/forgot-password') && !pathname.startsWith('/app/reset-password')) {
    const token = req.cookies.get('bf_member')?.value
    if (!token) return NextResponse.redirect(new URL('/app/login', req.url))
    try {
      await jwtVerify(token, SECRET())
    } catch {
      return NextResponse.redirect(new URL('/app/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/app/:path*'],
}
