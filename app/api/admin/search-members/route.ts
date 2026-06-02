import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({ members: [] })

  const { data } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, plan_override, credit_balance, status')
    .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`)
    .limit(10)

  // eslint-disable-next-line
  const members = (data ?? []).map((r: any) => ({
    id:           r.id,
    firstName:    r.first_name,
    lastName:     r.last_name,
    email:        r.email,
    planOverride: r.plan_override ?? '',
    creditBalance: Number(r.credit_balance ?? 0),
    status:       r.status ?? '',
  }))

  return NextResponse.json({ members })
}
