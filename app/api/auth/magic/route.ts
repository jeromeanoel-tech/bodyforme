import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getMemberByEmail, updateMemberPassword } from '@/lib/db'
import { signSession, COOKIE_NAME, COOKIE_OPTIONS } from '@/lib/session'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('email') ?? 'jerome.a.noel@gmail.com').toLowerCase()
  const ALLOWED = ['jerome.a.noel@gmail.com']

  if (!ALLOWED.includes(email)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Ensure password is set
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)
  const hash = await bcrypt.hash('BodyForme2026!', 10)
  await supabase.from('members').update({ password_hash: hash }).eq('email', email)

  // Log in
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
