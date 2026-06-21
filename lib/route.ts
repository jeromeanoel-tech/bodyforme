import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { getSession } from '@/lib/session'

type RouteContext = { params: Promise<Record<string, string>> }
type AdminHandler  = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>
type MemberHandler = (req: NextRequest, ctx: RouteContext) => Promise<NextResponse>

// Wraps an admin route: checks auth, catches all errors, returns clean JSON
export function withAdmin(handler: AdminHandler): AdminHandler {
  return async (req, ctx) => {
    try {
      const admin = await getAdminSession()
      if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      return await handler(req, ctx)
    } catch (e) {
      console.error('[admin route error]', req.nextUrl.pathname, e)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// Wraps a member route: checks auth, catches all errors, returns clean JSON
export function withMember(handler: MemberHandler): MemberHandler {
  return async (req, ctx) => {
    try {
      const session = await getSession()
      if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
      return await handler(req, ctx)
    } catch (e) {
      console.error('[member route error]', req.nextUrl.pathname, e)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

// Wraps a public route: just catches errors
export function withHandler(handler: AdminHandler): AdminHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (e) {
      console.error('[route error]', req.nextUrl.pathname, e)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}
