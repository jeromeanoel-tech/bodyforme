import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
)

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: rows, error } = await supabase
    .from('schedule_template')
    .select('id, day, start_time, end_time, class_name, instructor')
    .order('day').order('start_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const VALID_DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  const annotated = (rows ?? []).map(r => ({
    id:         r.id,
    day:        r.day,
    day_length: r.day?.length,
    day_valid:  VALID_DAYS.includes((r.day ?? '').toLowerCase().trim()),
    start_time: r.start_time,
    class_name: r.class_name,
    instructor: r.instructor,
  }))

  const invalid = annotated.filter(r => !r.day_valid)

  return NextResponse.json({ total: annotated.length, invalid_count: invalid.length, invalid, all: annotated })
}
