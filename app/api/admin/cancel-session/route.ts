import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json() as { sessionId: string }
  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const { error } = await supabase
    .from('sessions')
    .update({ status: 'CANCELLED' })
    .eq('id', sessionId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
