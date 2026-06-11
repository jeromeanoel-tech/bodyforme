import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function POST(req: NextRequest) {
  const adminSession = await getAdminSession()
  if (!adminSession || adminSession.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { sessionId } = await req.json() as { sessionId: string }
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'CANCELLED' })
    .eq('id', sessionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Purge ISR cache so website and admin reflect the cancellation immediately
  revalidatePath('/classes')
  revalidatePath('/admin/schedule')
  revalidatePath('/admin/checkin')

  return NextResponse.json({ ok: true })
}
