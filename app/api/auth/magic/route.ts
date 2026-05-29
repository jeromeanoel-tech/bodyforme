import { NextRequest, NextResponse } from 'next/server'
import { getMemberByEmail } from '@/lib/db'
import { signSession, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/session'

export async function GET(req: NextRequest) {
  const key   = req.nextUrl.searchParams.get('key')
  const email = req.nextUrl.searchParams.get('email') ?? 'jerome.a.noel@gmail.com'

  if (key !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const member = await getMemberByEmail(email.toLowerCase())
  if (!member) return NextResponse.json({ error: 'member not found' }, { status: 404 })

  const token = await signSession({
    id:           member._id,
    email:        member.email,
    firstName:    member.firstName,
    lastName:     member.lastName,
    wixContactId: '',
  })

  const res = NextResponse.redirect(new URL('/app/schedule', req.url))
  res.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS)
  return res
}
