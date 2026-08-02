import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'
import { melbToUtc } from '@/lib/dates'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
)

async function getOrCreateServiceId(className: string): Promise<string | undefined> {
  const { data: existing } = await supabase.from('services').select('id').eq('name', className).limit(1)
  if (existing?.[0]?.id) return existing[0].id
  const { data: created } = await supabase.from('services')
    .insert({ name: className, description: '', duration: 60, capacity: 20 })
    .select('id').single()
  return created?.id
}

// ── GET — list upcoming pop-up sessions ──────────────────────────────────────

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await supabase
    .from('sessions')
    .select('id, title, instructor_name, start_time, end_time, capacity, status')
    .eq('is_popup', true)
    .neq('status', 'CANCELLED')
    .gt('start_time', new Date().toISOString())
    .order('start_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
}

// ── POST — create a one-off pop-up session ───────────────────────────────────

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { date, start_time, end_time, class_name, instructor, capacity } = body as {
    date:       string
    start_time: string
    end_time:   string
    class_name: string
    instructor: string
    capacity?:  number
  }

  if (!date || !start_time || !end_time || !class_name?.trim()) {
    return NextResponse.json({ error: 'date, start_time, end_time and class_name are required' }, { status: 400 })
  }

  const startISO = melbToUtc(date, start_time)
  const endISO   = melbToUtc(date, end_time)

  if (new Date(startISO) <= new Date()) {
    return NextResponse.json({ error: 'Pop-up class must be in the future' }, { status: 400 })
  }
  if (endISO <= startISO) {
    return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 })
  }

  const serviceId = await getOrCreateServiceId(class_name.trim())
  if (!serviceId) return NextResponse.json({ error: 'Could not create service' }, { status: 500 })

  const { data, error } = await supabase.from('sessions').insert({
    service_id:      serviceId,
    title:           class_name.trim(),
    instructor_name: instructor ?? '',
    start_time:      startISO,
    end_time:        endISO,
    capacity:        capacity ?? 20,
    status:          'CONFIRMED',
    is_popup:        true,
  }).select('id, title, instructor_name, start_time, end_time, capacity, status').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/checkin')
  revalidatePath('/app/schedule')

  return NextResponse.json({ session: data })
}

// ── DELETE — cancel a pop-up session ────────────────────────────────────────

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await req.json() as { id: string }
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('sessions').update({ status: 'CANCELLED' }).eq('id', id).eq('is_popup', true)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/checkin')
  revalidatePath('/app/schedule')

  return NextResponse.json({ ok: true })
}
