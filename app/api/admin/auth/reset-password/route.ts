import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAdminPasswordResetToken, markAdminTokenUsed, setAdminPasswordOverride } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json() as { token: string; password: string }
    if (!token || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    const record = await getAdminPasswordResetToken(token)
    if (!record) return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 })
    if (record.usedAt) return NextResponse.json({ error: 'This link has already been used' }, { status: 400 })
    if (new Date(record.expiresAt) < new Date()) return NextResponse.json({ error: 'This link has expired — please request a new one' }, { status: 400 })

    const hash = await bcrypt.hash(password, 10)
    await setAdminPasswordOverride(record.username, hash)
    await markAdminTokenUsed(token)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
