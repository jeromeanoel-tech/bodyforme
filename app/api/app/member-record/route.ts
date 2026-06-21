import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'


export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabase
    .from('members')
    .select('first_name, last_name, email, phone, suburb')
    .eq('id', session.id)
    .single()

  if (!data) return NextResponse.json({})

  return NextResponse.json({
    firstName: data.first_name ?? '',
    lastName:  data.last_name  ?? '',
    email:     data.email      ?? '',
    phone:     data.phone      ?? '',
    suburb:    data.suburb     ?? '',
  })
}
