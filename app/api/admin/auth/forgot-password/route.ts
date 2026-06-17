import { NextResponse } from 'next/server'
import { createAdminPasswordResetToken } from '@/lib/db'
import { emailAdminPasswordReset } from '@/lib/email'

type StaffRecord = { username: string; name: string; role: string }

function getStaff(): StaffRecord[] {
  try {
    return JSON.parse(process.env.ADMIN_CREDENTIALS ?? '[]') as StaffRecord[]
  } catch {
    return []
  }
}

export async function POST(req: Request) {
  try {
    const { username } = await req.json() as { username: string }
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 })

    const staff = getStaff()
    const user  = staff.find(s => s.username === username.toLowerCase().trim())

    // Always return success — don't reveal whether username exists
    if (user) {
      const token    = await createAdminPasswordResetToken(user.username)
      const base     = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'
      const resetUrl = `${base}/admin/reset-password?token=${token}`
      await emailAdminPasswordReset({ username: user.username, name: user.name, resetUrl })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
