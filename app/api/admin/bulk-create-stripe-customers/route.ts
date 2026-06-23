import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { updateMemberCredential } from '@/lib/db'
import { supabase } from '@/lib/supabase'

export async function POST() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim()
  const { default: Stripe } = await import('stripe')
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

  // Fetch all active members without a Stripe customer ID
  const { data: rows, error } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, stripe_customer_id')
    .eq('status', 'active')
    .is('stripe_customer_id', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const members = rows ?? []
  const created: string[] = []
  const skipped: string[] = []
  const failed:  string[] = []

  for (const m of members) {
    if (!m.email || m.email.includes('@bodyforme.placeholder') || m.email.includes('@bodyforme.internal')) {
      skipped.push(m.id)
      continue
    }
    try {
      const customer = await stripe.customers.create({
        email:    m.email,
        name:     `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim(),
        metadata: { memberId: m.id },
      })
      await updateMemberCredential(m.id, { stripeCustomerId: customer.id })
      created.push(m.id)
    } catch {
      failed.push(m.id)
    }
  }

  return NextResponse.json({ created: created.length, skipped: skipped.length, failed: failed.length })
}
