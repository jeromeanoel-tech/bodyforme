import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

// Map memberships.status → members.status so both tables stay in sync
function toMemberStatus(s: string): string {
  if (s === 'ACTIVE')                       return 'active'
  if (s === 'CANCELED' || s === 'CANCELLED') return 'inactive'
  if (s === 'PAUSED')                        return 'paused'
  return 'inactive'
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const { error } = await supabase
    .from('memberships')
    .update({ status })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Keep members.status in sync so Admin > Clients and the member app see the same state
  const { data: mem } = await supabase.from('memberships').select('member_id').eq('id', id).single()
  if (mem?.member_id) {
    await supabase.from('members').update({ status: toMemberStatus(status) }).eq('id', mem.member_id)
  }

  revalidatePath('/admin/memberships')
  revalidatePath('/admin/clients')
  return NextResponse.json({ ok: true })
}
