import { NextRequest, NextResponse } from 'next/server'
import { getMemberById } from '@/lib/db'
import { getAdminSession } from '@/lib/adminSession'

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const memberId = req.nextUrl.searchParams.get('memberId')
    if (!memberId) return NextResponse.json({ error: 'memberId required' }, { status: 400 })

    const member = await getMemberById(memberId)
    if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 })

    if (!member.stripeCustomerId) {
      return NextResponse.json({ invoices: [] })
    }

    const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n/g, '').trim()
    if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })

    const { default: Stripe } = await import('stripe')
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-04-10' as never })

    const { data: rawInvoices } = await stripe.invoices.list({
      customer: member.stripeCustomerId,
      limit:    12,
    })

    const invoices = rawInvoices.map(inv => ({
      id:          inv.id,
      date:        inv.created,
      amount:      inv.amount_paid,
      status:      inv.status ?? 'unknown',
      description: inv.lines?.data?.[0]?.description ?? '',
      invoiceUrl:  inv.hosted_invoice_url ?? null,
    }))

    return NextResponse.json({ invoices })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[invoice-history] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
