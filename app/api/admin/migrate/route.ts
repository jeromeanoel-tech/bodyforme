import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { supabase } from '@/lib/supabase'

// One-time migration runner — applies schema changes that were added after initial deploy.
// Admin-only. Safe to call multiple times (all statements are IF NOT EXISTS).
export async function POST() {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const migrations = [
    `CREATE UNIQUE INDEX IF NOT EXISTS sessions_service_start_unique ON sessions (service_id, start_time)`,
  ]

  const results: { sql: string; ok: boolean; error?: string }[] = []

  for (const sql of migrations) {
    const { error } = await supabase.rpc('exec_sql', { sql })
    results.push({ sql, ok: !error, error: error?.message })
  }

  const allOk = results.every(r => r.ok)
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 500 })
}
