import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createMemberCredential, getMemberByEmail } from '@/lib/db'
import { emailWelcome } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { email, password, firstName, lastName, phone, suburb } = await req.json()

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

  await createMemberCredential({
    email:            email.toLowerCase(),
    passwordHash,
    firstName,
    lastName:         lastName ?? '',
    phone:            phone ?? '',
    suburb:           suburb ?? '',
    status:           'pending',
    wixContactId:     '',
    stripeCustomerId: '',
    planOverride:     '',
    nextBillingDate:  '',
    creditBalance:    0,
    adminNotes:       '',
  })

  await emailWelcome({ to: email.toLowerCase(), firstName })

  return NextResponse.json({ ok: true })
}
