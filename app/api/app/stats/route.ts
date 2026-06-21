import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'


export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString()

  const { data } = await supabase
    .from('bookings')
    .select('id, status, attended, created_at, sessions!inner(start_time, title)')
    .eq('member_id', session.id)
    .neq('status', 'CANCELLED')
    .gte('sessions.start_time', yearStart)
    .order('sessions.start_time', { ascending: false })

  const now = new Date()
  let completed = 0
  let upcoming  = 0
  const classCounts: Record<string, number> = {}

  // eslint-disable-next-line
  for (const b of (data ?? []) as any[]) {
    const start = b.sessions?.start_time ? new Date(b.sessions.start_time) : null
    if (!start) continue
    if (start < now) {
      completed++
      const title = (b.sessions?.title ?? '').split('(')[0].trim()
      classCounts[title] = (classCounts[title] ?? 0) + 1
    } else {
      upcoming++
    }
  }

  const favourite = Object.entries(classCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  return NextResponse.json({ completed, upcoming, favourite })
}
