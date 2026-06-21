import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'


export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { firstName, lastName, phone, suburb } = await req.json()

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: 'First and last name are required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('members')
    .update({
      first_name: firstName.trim(),
      last_name:  lastName.trim(),
      phone:      phone?.trim()  ?? '',
      suburb:     suburb?.trim() ?? '',
    })
    .eq('id', session.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
