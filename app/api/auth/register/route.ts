import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createMemberCredential, getMemberByEmail } from '@/lib/db'

export async function POST(req: NextRequest) {
  const { email, password, firstName, lastName, phone, suburb, plan } = await req.json()

  if (!email || !password || !firstName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  // Check if email already registered
  const existing = await getMemberByEmail(email.toLowerCase())
  if (existing) {
    return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  // Free trial gets 1 credit immediately at account creation so the member
  // can book without depending on a second API call succeeding.
  const isFreeTrial   = plan === 'free-trial'
  const planOverride  = isFreeTrial ? 'Free Trial' : (plan ?? '')
  const creditBalance = isFreeTrial ? 1 : 0

  await createMemberCredential({
    email:            email.toLowerCase(),
    passwordHash,
    firstName,
    lastName:         lastName ?? '',
    phone:            phone ?? '',
    suburb:           suburb ?? '',
    status:           planOverride ? 'active' : 'pending',
    wixContactId:     '',
    stripeCustomerId: '',
    planOverride,
    nextBillingDate:  '',
    creditBalance,
    adminNotes:       '',
  })

  // Welcome email is sent by the Stripe webhook after checkout.session.completed
  // (or by free-trial-signup route for free plans). Do not send here.

  return NextResponse.json({ ok: true })
}
