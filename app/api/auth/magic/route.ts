import { NextRequest, NextResponse } from 'next/server'
import { getMemberByEmail } from '@/lib/db'
import { signSession, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/session'

const ALLOWED = ['jerome.a.noel@gmail.com', 'suzanne@bodyforme.com.au', 'suzanne.harb@gmail.com']

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') ?? 'jerome.a.noel@gmail.com').toLowerCase()

  if (!ALLOWED.includes(email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const member = await getMemberByEmail(email)
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
