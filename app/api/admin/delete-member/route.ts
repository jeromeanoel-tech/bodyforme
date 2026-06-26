import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
)

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { memberId } = await req.json()
  if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

  // Block deletion if member has confirmed future bookings
  const now = new Date().toISOString()
  const { data: futureBookings } = await supabase
    .from('bookings')
    .select('id, sessions!inner(start_time)')
    .eq('member_id', memberId)
    .eq('status', 'CONFIRMED')
    .gt('sessions.start_time', now)

  if (futureBookings && futureBookings.length > 0) {
    return NextResponse.json(
      { error: `Cannot delete — member has ${futureBookings.length} upcoming booking${futureBookings.length === 1 ? '' : 's'}. Cancel them first.` },
      { status: 409 }
    )
  }

  // bookings, memberships, waitlist entries cascade-delete automatically (ON DELETE CASCADE)
  const { error } = await supabase.from('members').delete().eq('id', memberId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: true })
}
