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

  const { data: rows, error } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, stripe_customer_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter in JS — avoids PostgREST empty-string eq. parsing ambiguity
  const members = (rows ?? []).filter((m: any) => !m.stripe_customer_id)
  const created:  { id: string; email: string; customerId: string }[] = []
  const reused:   { id: string; email: string; customerId: string }[] = []
  const skipped:  string[] = []
  const failed:   { id: string; email: string; error: string }[] = []

  for (const m of members) {
    if (!m.email || m.email.includes('@bodyforme.placeholder') || m.email.includes('@bodyforme.internal')) {
      skipped.push(m.id)
      continue
    }

    try {
      // Check if a Stripe customer already exists for this email — reuse rather than duplicate
      const existing = await stripe.customers.list({ email: m.email, limit: 1 })
      if (existing.data.length > 0) {
        const customerId = existing.data[0].id
        await updateMemberCredential(m.id, { stripeCustomerId: customerId })
        reused.push({ id: m.id, email: m.email, customerId })
        continue
      }

      const customer = await stripe.customers.create({
        email:    m.email,
        name:     `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim(),
        metadata: { memberId: m.id },
      })
      await updateMemberCredential(m.id, { stripeCustomerId: customer.id })
      created.push({ id: m.id, email: m.email, customerId: customer.id })
    } catch (err) {
      failed.push({ id: m.id, email: m.email, error: String(err) })
    }
  }

  return NextResponse.json({
    created: created.length,
    reused:  reused.length,
    skipped: skipped.length,
    failed:  failed.length,
    details: { created, reused, failed },
  })
}
