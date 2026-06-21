import { supabase } from '@/lib/supabase'
import { type NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'


export async function POST(_req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  // Fetch all sessions
  const { data: sessions, error } = await supabase
    .from('sessions')
    .select('id, start_time, end_time, service_id, instructor_name, title, status')
    .order('start_time')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Group by dedup key: start_time + instructor_name (service_id may differ if services were also duped)
  const groups: Record<string, { id: string; hasBookings: boolean }[]> = {}
  for (const s of (sessions ?? [])) {
    const key = `${s.start_time}|${s.instructor_name ?? ''}`
    if (!groups[key]) groups[key] = []
    groups[key].push({ id: s.id, hasBookings: false })
  }

  // Find which sessions have bookings
  const allIds = (sessions ?? []).map((s: { id: string }) => s.id)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('session_id')
    .in('session_id', allIds)
  const bookedIds = new Set((bookings ?? []).map((b: { session_id: string }) => b.session_id))

  // For each group with duplicates, delete extras (keep one with bookings if any, else keep first)
  const toDelete: string[] = []
  let dupGroups = 0
  for (const [, members] of Object.entries(groups)) {
    if (members.length < 2) continue
    dupGroups++
    const withBookings = members.filter(m => bookedIds.has(m.id))
    const keep = withBookings.length > 0 ? withBookings[0].id : members[0].id
    for (const m of members) {
      if (m.id !== keep) toDelete.push(m.id)
    }
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ ok: true, message: 'No duplicates found', deleted: 0, dupGroups: 0 })
  }

  const { error: delError } = await supabase
    .from('sessions')
    .delete()
    .in('id', toDelete)

  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 })

  return NextResponse.json({ ok: true, deleted: toDelete.length, dupGroups, kept: dupGroups })
}
