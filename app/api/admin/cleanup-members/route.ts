import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'


// A test account is one that was created only for development/testing.
// We identify these by their email domain — never by absence from an allowlist,
// which would delete real members who joined after the list was written.
function isTestAccount(email: string) {
  return (
    email.includes('@bodyforme.placeholder') ||
    email.includes('@bodyforme.internal') ||
    email.includes('@bodyforme.test') ||
    email.includes('@example.com') ||
    email.endsWith('@test.com')
  )
}

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

  const testAccounts = members.filter(m => isTestAccount(m.email))

  return NextResponse.json({ total: members.length, duplicates, testAccounts })
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const purgeTest = new URL(req.url).searchParams.get('purge-test') === '1'

  const { data: members } = await supabase
    .from('members')
    .select('id, email, first_name, last_name, created_at, plan_override')
    .order('created_at', { ascending: true })

  if (!members) return NextResponse.json({ error: 'Could not fetch members' }, { status: 500 })

  const toDelete: string[] = []

  if (purgeTest) {
    // Delete any member whose email is not in the real members list and not a placeholder
    for (const m of members) {
      if (isTestAccount(m.email)) toDelete.push(m.id)
    }
  } else {
    // Group by normalised name — keep the LAST created (the import), delete the rest
    const byName: Record<string, typeof members> = {}
    for (const m of members) {
      const key = `${m.first_name} ${m.last_name}`.toLowerCase().trim()
      if (!byName[key]) byName[key] = []
      byName[key].push(m)
    }
    for (const rows of Object.values(byName)) {
      if (rows.length < 2) continue
      const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))
      toDelete.push(...sorted.slice(0, -1).map(r => r.id))
    }
  }

  if (toDelete.length === 0) return NextResponse.json({ deleted: 0, message: 'No targets found' })

  const { error } = await supabase.from('members').delete().in('id', toDelete)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: toDelete.length })
}
