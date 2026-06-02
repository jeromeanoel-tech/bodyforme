import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSession } from '@/lib/session'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { data } = await supabase
    .from('members')
    .select('plan_override, credit_balance, next_billing_date, status')
    .eq('id', session.id)
    .single()

  if (!data) return NextResponse.json({ plan: null, creditBalance: 0, nextBillingDate: null, status: 'inactive' })

  return NextResponse.json({
    plan:            data.plan_override  ?? null,
    creditBalance:   Number(data.credit_balance ?? 0),
    nextBillingDate: data.next_billing_date ?? null,
    status:          data.status ?? 'active',
  })
}
