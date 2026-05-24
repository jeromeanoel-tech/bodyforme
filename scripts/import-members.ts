/**
 * Import members from a Mind Body xlsx export into the members table.
 *
 * Usage:
 *   npx tsx scripts/import-members.ts "Members Report - as of 09-May-2026 (1).xlsx"
 *
 * What it does:
 *   - Reads every row from the xlsx
 *   - Splits "Client Name" → first_name + last_name
 *   - Maps Mind Body Status → active/inactive/suspended
 *   - Upserts on email (safe to re-run)
 *   - Imported members have a LOCKED password hash — they must use
 *     "Forgot password" the first time they log in
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
 */

import * as fs   from 'fs'
import * as path from 'path'
import * as XLSX from 'xlsx'
import { createClient } from '@supabase/supabase-js'

// ── Load .env.local ───────────────────────────────────────────────────────────

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      const val = m[2].trim().replace(/^"(.*)"$/, '$1')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = (full ?? '').trim().split(/\s+/)
  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

function mapStatus(mbStatus: string): string {
  switch ((mbStatus ?? '').toLowerCase()) {
    case 'active':    return 'active'
    case 'suspended': return 'suspended'
    case 'declined':  return 'suspended'
    default:          return 'inactive'   // Terminated, Expired, etc.
  }
}

// Can never match a real bcrypt hash — forces "Forgot password" on first login
const LOCKED = '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const filePath = process.argv[2]
  if (!filePath) {
    console.error('Usage: npx tsx scripts/import-members.ts <path-to-xlsx>')
    process.exit(1)
  }

  const absPath = path.resolve(filePath)
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`)
    process.exit(1)
  }

  console.log(`\n══ BodyForme: Mind Body → Supabase member import ══\n`)
  console.log(`Reading: ${absPath}`)

  const workbook = XLSX.readFile(absPath)
  const sheet    = workbook.Sheets[workbook.SheetNames[0]]
  const rows     = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

  console.log(`Rows in file: ${rows.length}\n`)

  let inserted = 0, updated = 0, skipped = 0

  for (const row of rows) {
    const email = (row['Email Address'] ?? '').trim().toLowerCase()
    if (!email) { skipped++; continue }

    const { firstName, lastName } = splitName(row['Client Name'])
    const status   = mapStatus(row['Status'])
    const phone    = (row['Phone'] ?? '').replace(/\s/g, '')
    const planName = (row['Membership Tier'] ?? '').trim()

    let nextBillingDate = ''
    const rawDate = row['Next AutoPay Date']
    if (rawDate) {
      try {
        const d = new Date(rawDate)
        if (!isNaN(d.getTime())) nextBillingDate = d.toISOString().slice(0, 10)
      } catch { /* ignore */ }
    }

    const { data: existing } = await supabase
      .from('members')
      .select('id')
      .eq('email', email)
      .single()

    if (existing) {
      // Update non-auth fields only (don't overwrite password if they've already set one)
      const { error } = await supabase
        .from('members')
        .update({
          first_name:        firstName || undefined,
          last_name:         lastName  || undefined,
          phone:             phone     || undefined,
          status,
          plan_override:     planName  || undefined,
          next_billing_date: nextBillingDate || undefined,
        })
        .eq('id', existing.id)

      if (error) { console.warn(`  ⚠ update ${email}:`, error.message); skipped++ }
      else updated++
    } else {
      const { error } = await supabase
        .from('members')
        .insert({
          email,
          password_hash:     LOCKED,
          first_name:        firstName,
          last_name:         lastName,
          phone,
          status,
          plan_override:     planName,
          next_billing_date: nextBillingDate,
        })

      if (error) { console.warn(`  ⚠ insert ${email}:`, error.message); skipped++ }
      else inserted++
    }
  }

  console.log(`── Result ──────────────────────────────────`)
  console.log(`  Inserted (new):   ${inserted}`)
  console.log(`  Updated (exists): ${updated}`)
  console.log(`  Skipped (errors / no email): ${skipped}`)
  console.log(`\n══ Done ══\n`)
  console.log(`Imported members have a LOCKED password.`)
  console.log(`They must use "Forgot password" on the login page to set a new one.\n`)
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
