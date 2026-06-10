import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: members } = await supabase
    .from('members')
    .select('id, email, first_name, last_name, created_at, plan_override, credit_balance')
    .order('created_at', { ascending: true })

  if (!members) return NextResponse.json({ error: 'Could not fetch members' }, { status: 500 })

  // Find duplicates by normalised full name
  const byName: Record<string, typeof members> = {}
  for (const m of members) {
    const key = `${m.first_name} ${m.last_name}`.toLowerCase().trim()
    if (!byName[key]) byName[key] = []
    byName[key].push(m)
  }

  const duplicates = Object.entries(byName)
    .filter(([, rows]) => rows.length > 1)
    .map(([name, rows]) => ({ name, rows }))

  return NextResponse.json({ total: members.length, duplicates })
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: members } = await supabase
    .from('members')
    .select('id, email, first_name, last_name, created_at, plan_override')
    .order('created_at', { ascending: true })

  if (!members) return NextResponse.json({ error: 'Could not fetch members' }, { status: 500 })

  // Group by normalised name — keep the LAST created (the import), delete the rest
  const byName: Record<string, typeof members> = {}
  for (const m of members) {
    const key = `${m.first_name} ${m.last_name}`.toLowerCase().trim()
    if (!byName[key]) byName[key] = []
    byName[key].push(m)
  }

  const toDelete: string[] = []
  for (const rows of Object.values(byName)) {
    if (rows.length < 2) continue
    // Keep most recent, delete the rest
    const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))
    toDelete.push(...sorted.slice(0, -1).map(r => r.id))
  }

  if (toDelete.length === 0) return NextResponse.json({ deleted: 0, message: 'No duplicates found' })

  const { error } = await supabase.from('members').delete().in('id', toDelete)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: toDelete.length })
}
