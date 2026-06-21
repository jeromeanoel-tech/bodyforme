import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAdminSession } from '@/lib/adminSession'


type MemberRow = {
  firstName: string; lastName: string; email: string; phone: string
  plan: string; planOverride: string; credit: number
  startDate: string; endDate: string; notes: string
}

// Migration complete — member data removed from source code.
// PII (names, emails, phones, health notes) must not live in version control.
// To re-import: load a CSV from a private store (Supabase Storage, admin upload, etc.)
const MEMBERS: MemberRow[] = []

export async function POST(req: NextRequest) {
  // Auth check — admin only
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (MEMBERS.length === 0) {
    return NextResponse.json({ message: 'Import complete — no member data in source file.', total: 0 })
  }

  const force = req.nextUrl.searchParams.get('force') === '1'

  // Guard: don't double-import
  const { count } = await supabase.from('members').select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 5 && !force) {
    return NextResponse.json({
      error: `${count} members already exist. Add ?force=1 to re-run.`,
      count,
    }, { status: 409 })
  }

  const placeholderHash = await bcrypt.hash(process.env.MEMBER_PLACEHOLDER_PASSWORD ?? 'changeme', 8)
  const results: { name: string; status: string; error?: string }[] = []

  for (const m of MEMBERS) {
    const email = m.email.toLowerCase()

    const { data: existing } = await supabase
      .from('members').select('id').eq('email', email).single()

    if (existing && !force) {
      results.push({ name: `${m.firstName} ${m.lastName}`, status: 'skipped' })
      continue
    }

    const upsertPayload: Record<string, unknown> = {
      email,
      first_name:     m.firstName,
      last_name:      m.lastName,
      phone:          m.phone,
      status:         'active',
      plan_override:  m.planOverride,
      credit_balance: m.credit,
      admin_notes:    m.notes,
    }
    if (!existing) upsertPayload.password_hash = placeholderHash

    const { data: member, error: memberErr } = await supabase
      .from('members')
      .upsert(upsertPayload, { onConflict: 'email' })
      .select('id')
      .single()

    if (memberErr || !member) {
      results.push({ name: `${m.firstName} ${m.lastName}`, status: 'error', error: memberErr?.message })
      continue
    }

    if (!existing || force) {
      await supabase.from('memberships').upsert({
        member_id:  member.id,
        plan_id:    m.planOverride.toLowerCase().replace(/[\s/]+/g, '-'),
        plan_name:  m.plan,
        status:     'ACTIVE',
        start_date: m.startDate,
        end_date:   m.endDate,
      }, { onConflict: 'member_id' })
    }

    results.push({ name: `${m.firstName} ${m.lastName}`, status: existing ? 'updated' : 'created' })
  }

  const created = results.filter(r => r.status === 'created').length
  const updated = results.filter(r => r.status === 'updated').length
  const skipped = results.filter(r => r.status === 'skipped').length
  const errors  = results.filter(r => r.status === 'error').length

  return NextResponse.json({ summary: { created, updated, skipped, errors, total: MEMBERS.length }, results })
}
