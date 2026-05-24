/**
 * Seed the sessions (and services) tables from class_schedule.csv.
 *
 * Reads the weekly template CSV and generates recurring sessions for
 * the next N weeks from Monday of the current week. Skips rows with
 * Status === 'Cancelled'. Safe to re-run — checks for existing sessions
 * before inserting.
 *
 * Usage:
 *   npx tsx scripts/seed-schedule.ts              # default 12 weeks
 *   npx tsx scripts/seed-schedule.ts --weeks 8
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local.
 */

import * as fs   from 'fs'
import * as path from 'path'
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

// ── Parse time range "9:30 - 10:30 am" ───────────────────────────────────────

function parseTimeRange(raw: string): { startH: number; startM: number; endH: number; endM: number } | null {
  const m = raw.trim().match(/^(\d+):(\d+)\s*-\s*(\d+):(\d+)\s*(am|pm)$/i)
  if (!m) return null

  let startH = parseInt(m[1]), endH = parseInt(m[3])
  const startM = parseInt(m[2]), endM = parseInt(m[4])
  const isPM = m[5].toLowerCase() === 'pm'

  if (isPM) {
    if (endH !== 12) endH += 12
    if (startH !== 12) startH += 12
  } else {
    if (endH === 12) endH = 0
    if (startH === 12) startH = 0
  }

  return { startH, startM, endH, endM }
}

const DAY_OFFSET: Record<string, number> = {
  monday: 0, tuesday: 1, wednesday: 2, thursday: 3,
  friday: 4, saturday: 5, sunday: 6,
}

// ── Parse CSV (no external deps needed) ──────────────────────────────────────

interface ClassRow {
  day:         string
  className:   string
  instructor:  string
  startH:      number
  startM:      number
  endH:        number
  endM:        number
}

function parseCSV(content: string): ClassRow[] {
  const lines  = content.trim().split('\n')
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const rows: ClassRow[] = []

  for (const line of lines.slice(1)) {
    const cols = line.split(',').map(s => s.trim())
    const get  = (key: string) => cols[header.indexOf(key)] ?? ''

    if (get('status').toLowerCase() === 'cancelled') continue

    const day    = get('day').toLowerCase()
    const parsed = parseTimeRange(get('time'))
    if (!parsed || !(day in DAY_OFFSET)) continue

    rows.push({
      day,
      className:  get('class name'),
      instructor: get('instructor'),
      ...parsed,
    })
  }
  return rows
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function getMondayOfCurrentWeek(): Date {
  const now  = new Date()
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay()
  const d    = new Date(now)
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function toISO(base: Date, dayOffset: number, h: number, m: number): string {
  const d = new Date(base)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

// ── Ensure service exists, return its UUID ────────────────────────────────────

const serviceCache = new Map<string, string>()

async function getOrCreateService(name: string): Promise<string> {
  if (serviceCache.has(name)) return serviceCache.get(name)!

  const { data: existing } = await supabase
    .from('services')
    .select('id')
    .eq('name', name)
    .single()

  if (existing) {
    serviceCache.set(name, existing.id)
    return existing.id
  }

  const { data, error } = await supabase
    .from('services')
    .insert({ name, description: '', duration: 60, capacity: 20 })
    .select('id')
    .single()

  if (error) throw new Error(`Could not create service "${name}": ${error.message}`)
  serviceCache.set(name, data.id)
  return data.id
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const weeksArg   = process.argv.indexOf('--weeks')
  const weeksAhead = weeksArg !== -1 ? parseInt(process.argv[weeksArg + 1]) || 12 : 12

  const csvPath = path.join(process.cwd(), 'class_schedule.csv')
  if (!fs.existsSync(csvPath)) {
    console.error(`class_schedule.csv not found at ${process.cwd()}`)
    process.exit(1)
  }

  const classes = parseCSV(fs.readFileSync(csvPath, 'utf8'))

  console.log(`\n══ BodyForme: timetable seed ══\n`)
  console.log(`Template: ${classes.length} active classes`)
  console.log(`Generating: ${weeksAhead} weeks from current week\n`)

  const monday = getMondayOfCurrentWeek()
  let inserted = 0, skipped = 0

  for (let week = 0; week < weeksAhead; week++) {
    const weekStart = new Date(monday)
    weekStart.setDate(monday.getDate() + week * 7)

    for (const cls of classes) {
      const startISO  = toISO(weekStart, DAY_OFFSET[cls.day], cls.startH, cls.startM)
      const endISO    = toISO(weekStart, DAY_OFFSET[cls.day], cls.endH,   cls.endM)
      const serviceId = await getOrCreateService(cls.className)

      // Check if this exact session already exists
      const { data: exists } = await supabase
        .from('sessions')
        .select('id')
        .eq('title', cls.className)
        .eq('instructor_name', cls.instructor)
        .eq('start_time', startISO)
        .single()

      if (exists) { skipped++; continue }

      const { error } = await supabase
        .from('sessions')
        .insert({
          service_id:      serviceId,
          title:           cls.className,
          instructor_name: cls.instructor,
          start_time:      startISO,
          end_time:        endISO,
          capacity:        20,
          status:          'CONFIRMED',
        })

      if (error) { console.warn(`  ⚠ ${cls.className} ${startISO}:`, error.message); skipped++ }
      else inserted++
    }

    if (week % 4 === 3) process.stdout.write(`  … week ${week + 1}/${weeksAhead} done\n`)
  }

  console.log(`\n── Result ──────────────────────────────────`)
  console.log(`  Inserted: ${inserted}`)
  console.log(`  Skipped (already exist): ${skipped}`)
  console.log(`\n══ Done ══\n`)
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
