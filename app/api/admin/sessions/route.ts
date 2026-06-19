import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function GET(req: NextRequest) {
  const serviceId = req.nextUrl.searchParams.get('serviceId')
  if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 })

  const { data, error } = await supabase
    .from('sessions')
    .select('id, title, instructor_name, start_time, end_time, capacity, status')
    .eq('service_id', serviceId)
    .order('start_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: data ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { sessions: batch, serviceId, serviceName, instructorName, startTime, endTime, capacity } = body

  if (!serviceId) return NextResponse.json({ error: 'serviceId required' }, { status: 400 })

  // Batch insert: array of { startTime, endTime } for recurring sessions
  if (Array.isArray(batch)) {
    if (batch.length === 0) return NextResponse.json({ error: 'sessions array is empty' }, { status: 400 })
    const rows = batch.map((s: { startTime: string; endTime: string }) => ({
      service_id:      serviceId,
      title:           serviceName ?? '',
      instructor_name: instructorName ?? '',
      start_time:      s.startTime,
      end_time:        s.endTime,
      capacity:        capacity ?? 10,
      status:          'CONFIRMED',
    }))
    const { data, error } = await supabase.from('sessions').insert(rows).select('id')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    revalidatePath('/admin/schedule')
    revalidatePath('/admin/classes')
    revalidatePath('/admin/checkin')
    revalidatePath('/classes')
    return NextResponse.json({ ids: data.map((r: { id: string }) => r.id), count: data.length })
  }

  // Single session insert
  if (!startTime || !endTime) {
    return NextResponse.json({ error: 'startTime and endTime required' }, { status: 400 })
  }
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      service_id:      serviceId,
      title:           serviceName ?? '',
      instructor_name: instructorName ?? '',
      start_time:      startTime,
      end_time:        endTime,
      capacity:        capacity ?? 10,
      status:          'CONFIRMED',
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/classes')
  revalidatePath('/admin/checkin')
  revalidatePath('/classes')

  return NextResponse.json({ id: data.id })
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, instructorName } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase
    .from('sessions')
    .update({ instructor_name: instructorName ?? '' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/classes')
  revalidatePath('/admin/checkin')

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/classes')
  revalidatePath('/admin/checkin')
  revalidatePath('/classes')

  return NextResponse.json({ ok: true })
}
