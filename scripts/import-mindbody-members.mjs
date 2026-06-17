/**
 * Import MindBody members to Supabase.
 * Reads directly from spreadsheets — no hardcoded member data.
 *
 * Sources:
 *   1. "Visits Remaining Report 1-05-2026 - 31-05-2026.xlsx"
 *      → credits (Visits Remaining), expiry dates, email, phone, notes
 *   2. "Membership_Series_Detail (2).xls"
 *      → more current billing-period dates for DD/recurring members
 *      → 7 additional active members not captured in the Visits report
 *
 * Membership rules:
 *   - creditBalance always comes from "Visits Remaining" (pack/casual plans only)
 *   - Dates use the Detail file when available (renewed periods are more current)
 *   - DD plans ("direct debit" in name): end_date = null — Stripe controls active status
 *   - Pack/casual plans: end_date from VR Report expiry date
 *   - status='pending' when: missing email, missing pack end_date, or unknown plan type
 *   - status='active' otherwise (even if plan has expired — flagged for Suzanne)
 *   - memberships table row created only for active recurring/unlimited plans, not packs
 *
 * Usage:
 *   node scripts/import-mindbody-members.mjs            # import
 *   node scripts/import-mindbody-members.mjs --dry-run  # preview only
 *   node scripts/import-mindbody-members.mjs --force    # re-run / overwrite existing
 */

import { createRequire } from 'module'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { readFileSync, writeFileSync } from 'fs'

const require = createRequire(import.meta.url)
const XLSX = require('xlsx')

// ── Env ──────────────────────────────────────────────────────────────────────
function getEnv(key) {
  // Check process.env first (Vercel / CI), then fall back to .env.local
  if (process.env[key]) return process.env[key]
  try {
    const envRaw = readFileSync('.env.local', 'utf8')
    const line = envRaw.split('\n').find(l => l.startsWith(key + '='))
    if (!line) return ''
    const val = line.slice(key.length + 1).trim()
    return val.startsWith('"') ? val.slice(1, val.lastIndexOf('"')) : val
  } catch { return '' }
}

// Lazily initialised — dry-run doesn't need a DB connection
let _supabase = null
function getSupabase() {
  if (_supabase) return _supabase
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key = getEnv('SUPABASE_SECRET_KEY')
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  _supabase = createClient(url.replace(/\\n/g, '').trim(), key.replace(/\\n/g, '').trim())
  return _supabase
}

// ── Config ───────────────────────────────────────────────────────────────────
const TODAY       = new Date().toISOString().slice(0, 10)
const VR_FILE     = 'Visits Remaining Report 1-05-2026 - 31-05-2026.xlsx'
const DETAIL_FILE = 'Membership_Series_Detail (2).xls'
const FLAGS_OUT   = 'scripts/migration-flags.txt'

// MindBody encodes "unlimited" visits as 99999, 999999, etc.
const UNLIMITED_THRESHOLD = 9000

// ── Plan classification ───────────────────────────────────────────────────────
// Returns { planOverride, planType: 'pack'|'weekly'|'unlimited'|'unknown', isDD }
function classifyPlan(rawPlanName, visitsRemaining) {
  const p   = rawPlanName.toLowerCase().trim().replace(/\s+/g, ' ')
  const vis = Number(visitsRemaining ?? 0)
  const isDD = p.includes('direct debit')

  if (p.includes('per week') || p === 'weekly direct debit') {
    return { planOverride: '3 per week', planType: 'weekly', isDD: true }
  }

  if (
    vis > UNLIMITED_THRESHOLD ||
    p.includes('unlimited') ||
    p.includes('monthly studio') ||
    p.includes('welcome back') ||
    p.includes('intro pass') ||
    p.includes('new student')
  ) {
    return { planOverride: 'Unlimited', planType: 'unlimited', isDD }
  }

  if (p.includes('50 class'))  return { planOverride: '50-Class Pass',  planType: 'pack', isDD: false }
  if (p.includes('20 class'))  return { planOverride: '20-Class Pack',  planType: 'pack', isDD: false }
  if (p.includes('10 class'))  return { planOverride: '10-Class Pack',  planType: 'pack', isDD: false }
  if (p.includes('classpass')) return { planOverride: 'Casual Drop-in', planType: 'pack', isDD: false }
  if (p.includes('casual'))    return { planOverride: 'Casual Drop-in', planType: 'pack', isDD: false }

  return { planOverride: rawPlanName, planType: 'unknown', isDD }
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function parseAUDate(s) {
  if (!s) return null
  const str = String(s).trim()
  if (!str || str === '-') return null
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
}

// ── HTML table parser (MindBody .xls files are actually HTML) ────────────────
function parseHtmlRows(html) {
  const rows  = []
  const trRe  = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let trMatch
  while ((trMatch = trRe.exec(html)) !== null) {
    const cells  = []
    const inner  = trMatch[1]
    const tdRe   = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
    let tdMatch
    while ((tdMatch = tdRe.exec(inner)) !== null) {
      const text = tdMatch[1]
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;|&#160;|\xa0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
      cells.push(text)
    }
    if (cells.length >= 4 && cells.some(c => c)) rows.push(cells)
  }
  return rows
}

// ── Read Membership Series Detail file ───────────────────────────────────────
// Returns Map<mbId, { name, planName, startDate, endDate }>
// Only includes Active members; keeps the latest (most current) row per member.
function readDetailFile() {
  const html    = readFileSync(DETAIL_FILE, 'utf8')
  const allRows = parseHtmlRows(html)
  const result  = new Map()

  for (const row of allRows) {
    const id = row[0]?.replace(/\s/g, '')
    if (!id || !/^\d{7,12}$/.test(id)) continue

    const name   = (row[1] ?? '').replace(/\xa0/g, ' ').replace(/\s+/g, ' ').trim()
    const plan   = (row[2] ?? '').trim()
    const status = (row[3] ?? '').trim().toLowerCase()
    const startD = parseAUDate(row[4])
    const endD   = parseAUDate(row[5])

    if (status !== 'active') continue

    // Keep the entry with the latest end date (in case of multiple billing periods)
    const existing = result.get(id)
    if (existing?.endDate && endD && endD <= existing.endDate) continue

    result.set(id, { name, planName: plan, startDate: startD, endDate: endD })
  }
  return result
}

// ── Parse MindBody name format "Last, First" ─────────────────────────────────
function parseName(raw) {
  const str = (raw ?? '').replace(/\xa0/g, ' ').replace(/\s+/g, ' ').trim()
  const idx = str.indexOf(',')
  if (idx < 0) return { firstName: '', lastName: str }
  return { firstName: str.slice(idx + 1).trim(), lastName: str.slice(0, idx).trim() }
}

// ── Build the full member list from both sources ──────────────────────────────
function buildMemberList(vrRows, detailMap) {
  const members    = []
  const seenMbIds  = new Set()

  // ── Phase 1: Visits Remaining Report (primary source) ─────────────────────
  for (const row of vrRows) {
    const mbId = String(row['Client ID'] ?? '').trim()
    const { firstName, lastName } = parseName(row['Client Name'])

    const rawPlan  = String(row['Pricing option'] ?? '').trim()
    const visits   = Number(row['Visits Remaining'] ?? 0)
    const rawEmail = String(row['Email Address'] ?? '').trim().toLowerCase()
    const phone    = String(row['Mobile Phone'] || row['Home Phone'] || '').trim()
    const mbNotes  = [
      String(row['Red Alert']    ?? '').trim(),
      String(row['Yellow Alert'] ?? '').trim(),
    ].filter(Boolean).join('\n').trim()

    const vrStart = parseAUDate(String(row['First Activation Date'] ?? ''))
    const vrEnd   = parseAUDate(String(row['Last Expiration Date']  ?? ''))

    const { planOverride, planType, isDD } = classifyPlan(rawPlan, visits)
    const creditBalance = planType === 'pack' ? visits : 0

    // Date source: Detail file has more current billing periods for DD/recurring members
    const detail   = detailMap.get(mbId)
    let startDate  = vrStart
    let endDate    = vrEnd
    let dateSource = 'VR Report'
    if (detail) {
      startDate  = detail.startDate ?? vrStart
      endDate    = detail.endDate   ?? vrEnd
      dateSource = 'Membership Detail (current billing period)'
    }

    // DD plans are ongoing — Stripe controls active status, not a date
    const membershipEndDate = isDD ? null : endDate

    // ── Flags ────────────────────────────────────────────────────────────────
    const flags = []

    const validEmail = rawEmail && rawEmail !== 'na' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(rawEmail)
    if (!validEmail) {
      flags.push('MISSING_EMAIL: No valid email on file. Member cannot log in online until Suzanne adds it.')
    }

    if (planType === 'pack') {
      if (!vrEnd) {
        flags.push('MISSING_END_DATE: Pack expiry date not found in spreadsheet. Membership NOT set active — enter manually.')
      }
      if (visits === 0) {
        flags.push('ZERO_CREDITS: All classes in this pack have been used up. Member has 0 remaining.')
      }
    }

    if (membershipEndDate && membershipEndDate < TODAY) {
      flags.push(`PLAN_EXPIRED: End date ${membershipEndDate} is in the past. Verify in MindBody if member has renewed or transferred to Stripe.`)
    }

    if (planType === 'unknown') {
      flags.push(`UNKNOWN_PLAN: Plan "${rawPlan}" not recognised. Membership NOT set active — update plan manually in admin panel.`)
    }

    const hasBlockingFlag = flags.some(f =>
      f.startsWith('MISSING_END_DATE') ||
      f.startsWith('MISSING_EMAIL') ||
      f.startsWith('UNKNOWN_PLAN')
    )
    const status = hasBlockingFlag ? 'pending' : 'active'

    seenMbIds.add(mbId)
    members.push({
      mbId, firstName, lastName,
      email: validEmail ? rawEmail : null,
      phone, rawPlan, planOverride, planType, isDD,
      creditBalance, startDate, membershipEndDate, mbNotes, flags, status, dateSource,
    })
  }

  // ── Phase 2: Detail file members not in VR Report ─────────────────────────
  // These are active DD members who weren't captured in the May visits report.
  // They have dates from the Detail file but no email — flagged as pending.
  for (const [mbId, detail] of detailMap) {
    if (seenMbIds.has(mbId)) continue

    const { firstName, lastName } = parseName(detail.name)
    const { planOverride, planType, isDD } = classifyPlan(detail.planName, 0)

    const flags = [
      'MISSING_EMAIL: Member not in Visits Remaining Report. Find their email in MindBody and update manually.',
    ]

    if (!detail.endDate) {
      flags.push('MISSING_END_DATE: No end date found in Detail file.')
    } else if (detail.endDate < TODAY) {
      flags.push(`PLAN_EXPIRED: End date ${detail.endDate} is in the past.`)
    }

    seenMbIds.add(mbId)
    members.push({
      mbId, firstName, lastName,
      email: null, phone: '',
      rawPlan: detail.planName, planOverride, planType, isDD,
      creditBalance: 0,
      startDate: detail.startDate,
      membershipEndDate: isDD ? null : detail.endDate,
      mbNotes: '',
      flags,
      status: 'pending',
      dateSource: 'Membership Detail only',
    })
  }

  // ── Detect shared phone numbers (possible duplicates) ─────────────────────
  const phoneCount = {}
  for (const m of members) {
    if (m.phone) phoneCount[m.phone] = (phoneCount[m.phone] ?? 0) + 1
  }
  for (const m of members) {
    if (m.phone && phoneCount[m.phone] > 1) {
      m.flags.push(
        `POSSIBLE_DUPLICATE: Phone ${m.phone} appears on multiple member records. Check and merge in MindBody before activating.`
      )
    }
  }

  return members
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const dryRun = process.argv.includes('--dry-run')
  const force  = process.argv.includes('--force')

  console.log('Reading spreadsheets...')
  const vrWorkbook = XLSX.readFile(VR_FILE)
  const vrRows     = XLSX.utils.sheet_to_json(vrWorkbook.Sheets[vrWorkbook.SheetNames[0]])
  const detailMap = readDetailFile()
  const members   = buildMemberList(vrRows, detailMap)

  const nActive  = members.filter(m => m.status === 'active').length
  const nPending = members.filter(m => m.status === 'pending').length
  console.log(`\nTotal: ${members.length} members — ${nActive} active, ${nPending} pending (flagged)\n`)

  // ── Dry run ───────────────────────────────────────────────────────────────
  if (dryRun) {
    console.log('DRY RUN — no changes will be made\n')
    for (const m of members) {
      console.log(`[${m.status.toUpperCase().padEnd(7)}] ${m.firstName} ${m.lastName}`)
      console.log(`           Plan: ${m.planOverride} (${m.planType}) | Credits: ${m.creditBalance} | End: ${m.membershipEndDate ?? 'none (DD ongoing)'} | ${m.dateSource}`)
      for (const f of m.flags) console.log(`           ⚠  ${f}`)
      console.log()
    }
    generateFlagsReport(members)
    return
  }

  // ── Import ────────────────────────────────────────────────────────────────
  const placeholderPw = await bcrypt.hash('BodyForme2026!', 8)
  let nOk = 0, nSkip = 0, nFail = 0

  for (const m of members) {
    // Members without a real email get a non-functional internal placeholder so
    // they still have a unique email column. Suzanne must update these in admin panel.
    const email = m.email
      ?? `nologin.${m.firstName.toLowerCase().replace(/[^a-z]/g, '')}.${m.lastName.toLowerCase().replace(/[^a-z]/g, '')}.${m.mbId}@bodyforme.internal`

    const adminNotes = [
      m.mbNotes,
      m.flags.length
        ? `MIGRATION FLAGS (${new Date().toLocaleDateString('en-AU')}):\n${m.flags.map(f => '• ' + f).join('\n')}`
        : '',
    ].filter(Boolean).join('\n\n') || ''

    const db = getSupabase()

    // Check if already exists
    const { data: existing } = await db
      .from('members')
      .select('id, password_hash')
      .eq('email', email)
      .single()

    if (existing && !force) {
      console.log(`  SKIP  ${m.firstName} ${m.lastName} (already exists — use --force to update)`)
      nSkip++
      continue
    }

    // Upsert member row
    const { data: member, error } = await db
      .from('members')
      .upsert({
        email,
        password_hash:  existing?.password_hash ?? placeholderPw,
        first_name:     m.firstName,
        last_name:      m.lastName,
        phone:          m.phone,
        status:         m.status,
        plan_override:  m.planOverride,
        credit_balance: m.creditBalance,
        admin_notes:    adminNotes,
      }, { onConflict: 'email' })
      .select('id')
      .single()

    // Set end_date separately — column may not be in PostgREST schema cache
    if (!error && member && m.membershipEndDate) {
      await db.from('members').update({ end_date: m.membershipEndDate }).eq('id', member.id)
    }

    if (error || !member) {
      console.error(`  ERROR ${m.firstName} ${m.lastName}: ${error?.message}`)
      nFail++
      continue
    }

    // Membership row — only for active recurring/unlimited plans, not packs
    if (m.status === 'active' && m.planType !== 'pack') {
      const { error: memErr } = await db
        .from('memberships')
        .upsert({
          member_id:  member.id,
          plan_name:  m.rawPlan,
          status:     'ACTIVE',
          start_date: m.startDate ?? TODAY,
          end_date:   m.membershipEndDate ?? null,
        }, { onConflict: 'member_id' })
      if (memErr) {
        console.warn(`  WARN  membership row for ${m.firstName} ${m.lastName}: ${memErr.message}`)
      }
    }

    const flagMark = m.flags.length ? ` ⚠ ${m.flags.length} flag(s)` : ''
    const endStr   = m.membershipEndDate ?? 'ongoing (DD)'
    console.log(`  ✓ [${m.status}] ${m.firstName} ${m.lastName} — ${m.planOverride} | credits: ${m.creditBalance} | end: ${endStr}${flagMark}`)
    nOk++
  }

  console.log(`\nDone: ${nOk} imported, ${nSkip} skipped, ${nFail} failed`)
  generateFlagsReport(members)
}

// ── Flags report for Suzanne ──────────────────────────────────────────────────
function generateFlagsReport(members) {
  const flagged  = members.filter(m => m.flags.length > 0)
  const nActive  = members.filter(m => m.status === 'active').length
  const nPending = members.filter(m => m.status === 'pending').length

  const lines = [
    '=== MINDBODY MIGRATION — ACTION REQUIRED FOR SUZANNE ===',
    `Generated: ${new Date().toLocaleString('en-AU')}`,
    `Total: ${members.length} members | Active: ${nActive} | Pending (needs attention): ${nPending}`,
    '',
    'Pending members are in the system but cannot log in or book online until resolved.',
    'Active members with flags are imported correctly but may need a date or plan update.',
    '',
    '─────────────────────────────────────────────────────────',
    '',
    ...flagged.flatMap(m => {
      const endStr = m.membershipEndDate ?? (m.isDD ? 'none (DD — ongoing)' : 'not set')
      return [
        `${m.firstName} ${m.lastName}  [${m.status}]`,
        `  Plan: ${m.rawPlan} → ${m.planOverride} (${m.planType})`,
        `  Credits: ${m.creditBalance} | End date: ${endStr} | Source: ${m.dateSource}`,
        ...m.flags.map(f => `  ⚠  ${f}`),
        '',
      ]
    }),
    '─────────────────────────────────────────────────────────',
    '',
    'PENDING MEMBERS — enter these in the admin panel once you have their details:',
    '',
    ...members
      .filter(m => m.status === 'pending')
      .map(m => `  • ${m.firstName} ${m.lastName} (${m.rawPlan})`),
  ]

  const report = lines.join('\n')
  console.log('\n' + report)
  writeFileSync(FLAGS_OUT, report)
  console.log(`\nFlags report saved to ${FLAGS_OUT}`)
}

run().catch(console.error)
