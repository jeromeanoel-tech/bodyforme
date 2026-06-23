import { NextRequest, NextResponse } from 'next/server'
import { getMemberByEmail, updateMemberCredential, upsertMembership } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { email } = await req.json() as { email: string }
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim()
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

    const member = await getMemberByEmail(email.toLowerCase().trim())
    if (!member) return NextResponse.json({ error: 'No account found for that email.' }, { status: 404 })

    if (!member.stripeCustomerId) {
      // No Stripe customer — just update DB
      await updateMemberCredential(member._id, { status: 'inactive', planOverride: '' })
      await upsertMembership({
        memberId:  member._id,
        planName:  member.planOverride ?? '',
        status:    'CANCELED',
        startDate: '',
        endDate:   new Date().toISOString().slice(0, 10),
      })
      return NextResponse.json({ cancelled: 0, message: 'No Stripe subscription found — member marked inactive.' })
    }

    // Find all active/trialling subscriptions for this customer
    const subs = await stripe.subscriptions.list({
      customer: member.stripeCustomerId,
      status:   'active',
      limit:    10,
    })

    let cancelled = 0
    for (const sub of subs.data) {
      // Schedule cancellation at period end — member retains access until their paid period expires
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true })
      cancelled++
    }

    // Also check trialling — trialling subs haven't been charged, cancel immediately
    const trialling = await stripe.subscriptions.list({
      customer: member.stripeCustomerId,
      status:   'trialing',
      limit:    10,
    })
    for (const sub of trialling.data) {
      await (stripe.subscriptions as any).cancel(sub.id)
      cancelled++
    }

    // Update DB immediately (webhook will also fire but this is instant)
    const today = new Date().toISOString().slice(0, 10)
    await updateMemberCredential(member._id, { status: 'inactive', planOverride: '' })
    await upsertMembership({
      memberId:  member._id,
      planName:  member.planOverride ?? '',
      status:    'CANCELED',
      startDate: '',
      endDate:   today,
    })

    return NextResponse.json({
      cancelled,
      message: cancelled > 0
        ? `${cancelled} Stripe subscription${cancelled > 1 ? 's' : ''} cancelled.`
        : 'No active Stripe subscriptions found — member marked inactive.',
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[cancel-subscription] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
