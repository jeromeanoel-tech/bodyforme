import { NextResponse } from 'next/server'
import { getMemberByEmail, createPasswordResetToken } from '@/lib/db'
import { emailPasswordReset } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

    const member = await getMemberByEmail(email.toLowerCase().trim())

    // Always return success — don't reveal whether an email exists
    if (member) {
      const token = await createPasswordResetToken(member._id)
      const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'
      const resetUrl = `${base}/app/reset-password?token=${token}`
      await emailPasswordReset({ to: member.email, firstName: member.firstName, resetUrl })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
