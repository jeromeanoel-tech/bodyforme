import { NextResponse } from 'next/server'
import { runMigrations } from '@/lib/db'

// One-time endpoint — protected by a secret token in the Authorization header.
// Call: curl -X POST https://your-domain/api/migrate -H "Authorization: Bearer <MIGRATE_SECRET>"
export async function POST(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const secret = process.env.MIGRATE_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    await runMigrations()
    return NextResponse.json({ ok: true, message: 'Migrations complete' })
  } catch (err) {
    console.error('Migration failed:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
