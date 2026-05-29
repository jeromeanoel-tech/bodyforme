import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { secret, email, password } = await req.json()
  if (secret !== process.env.MIGRATE_SECRET) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!)
  const hash = await bcrypt.hash(password, 12)
  const { error } = await supabase.from('members').update({ password_hash: hash }).eq('email', email)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
