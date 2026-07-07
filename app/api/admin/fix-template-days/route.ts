import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
)

export async function POST() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: rows, error } = await supabase.from('schedule_template').select('id, day')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const toFix = (rows ?? []).filter(r => r.day && r.day !== r.day.toLowerCase().trim())
  let fixed = 0
  for (const r of toFix) {
    await supabase.from('schedule_template').update({ day: r.day.toLowerCase().trim() }).eq('id', r.id)
    fixed++
  }

  return NextResponse.json({ ok: true, checked: (rows ?? []).length, fixed })
}
