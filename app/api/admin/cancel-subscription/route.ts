import { NextRequest, NextResponse } from 'next/server'
import { getMemberById, updateMemberCredential, upsertMembership } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { memberId } = await req.json() as { memberId: string }
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim()
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

    const member = await getMemberById(memberId)
    if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 })

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

    // Cancel all non-ended subscriptions immediately
    const CANCELABLE = ['active', 'trialing', 'past_due', 'incomplete', 'unpaid'] as const
    let cancelled = 0
    for (const status of CANCELABLE) {
      const { data: subs } = await stripe.subscriptions.list({
        customer: member.stripeCustomerId,
        status,
        limit: 10,
      })
      for (const sub of subs) {
        await (stripe.subscriptions as any).cancel(sub.id)
        cancelled++
      }
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
