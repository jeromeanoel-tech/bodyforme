import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id, name, description, duration, capacity } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (name        !== undefined) patch.name        = name
  if (description !== undefined) patch.description = description
  if (duration    !== undefined) patch.duration    = duration
  if (capacity    !== undefined) patch.capacity    = capacity

  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

  const { error } = await supabase.from('services').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Cascade capacity changes to all future sessions of this class type
  if (capacity !== undefined) {
    await supabase
      .from('sessions')
      .update({ capacity })
      .eq('service_id', id)
      .gt('start_time', new Date().toISOString())
      .neq('status', 'CANCELLED')
  }

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/classes')

  return NextResponse.json({ ok: true })
}

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: services, error } = await supabase
    .from('services')
    .select('id, name, description, duration, capacity, created_at')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const now = new Date().toISOString()
  const { data: sessionCounts } = await supabase
    .from('sessions')
    .select('service_id')
    .gte('start_time', now)
    .neq('status', 'CANCELLED')

  const countMap: Record<string, number> = {}
  ;(sessionCounts ?? []).forEach((s: { service_id: string }) => {
    countMap[s.service_id] = (countMap[s.service_id] ?? 0) + 1
  })

  const result = (services ?? []).map((s: { id: string; name: string; description: string; duration: number; capacity: number; created_at: string }) => ({
    ...s,
    upcomingSessions: countMap[s.id] ?? 0,
  }))

  return NextResponse.json({ services: result })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { name, description, duration, capacity } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data, error } = await supabase
    .from('services')
    .insert({ name: name.trim(), description: description ?? '', duration: duration ?? 60, capacity: capacity ?? 10 })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/classes')

  return NextResponse.json({ id: data.id })
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  // Refuse deletion if any future sessions have active bookings
  const { data: futureSessions } = await supabase
    .from('sessions')
    .select('id')
    .eq('service_id', id)
    .gt('start_time', new Date().toISOString())
    .neq('status', 'CANCELLED')

  if (futureSessions && futureSessions.length > 0) {
    const sessionIds = futureSessions.map((s: { id: string }) => s.id)
    const { count: bookingCount } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('session_id', sessionIds)
      .neq('status', 'CANCELLED')

    if (bookingCount && bookingCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete: ${bookingCount} upcoming booking${bookingCount !== 1 ? 's' : ''} exist across ${futureSessions.length} future session${futureSessions.length !== 1 ? 's' : ''}. Cancel the sessions first.` },
        { status: 409 }
      )
    }
  }

  await supabase.from('sessions').delete().eq('service_id', id)
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/admin/schedule')
  revalidatePath('/admin/classes')
  revalidatePath('/admin/checkin')
  revalidatePath('/classes')

  return NextResponse.json({ ok: true })
}
