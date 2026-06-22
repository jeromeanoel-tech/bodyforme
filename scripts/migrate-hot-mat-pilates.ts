/**
 * Migrate three class slots to new Hot Mat Pilates variants:
 *   - Friday    9:30 AM  "Hot Pilates"   → "Hot Mat Pilates (Strength)"
 *   - Sunday    8:00 AM  "Hot Pilates"   → "Hot Mat Pilates (Sculpt/Strength/Core)"
 *   - Tuesday   7:00 PM  "Special Forces"→ "Hot Mat Pilates (Core)"
 *
 * Only updates future sessions (from today onwards). Safe to re-run.
 *
 * Usage:
 *   npx tsx scripts/migrate-hot-mat-pilates.ts
 */

import * as fs   from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      const val = m[2].trim().replace(/^"(.*)"$/, '$1').replace(/\\n$/, '')
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

async function getOrCreateService(name: string, duration: number, capacity: number): Promise<string> {
  const { data: existing } = await supabase
    .from('services')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (existing) return existing.id

  const { error: insertError } = await supabase
    .from('services')
    .insert({ name, description: '', duration, capacity })

  if (insertError) throw new Error(`Could not create service "${name}": ${insertError.message}`)

  // Re-fetch after insert
  const { data, error: fetchError } = await supabase
    .from('services')
    .select('id')
    .eq('name', name)
    .maybeSingle()

  if (fetchError || !data) throw new Error(`Could not find service "${name}" after insert`)
  console.log(`  Created service: ${name}`)
  return data.id
}

// day-of-week numbers: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const CHANGES = [
  { oldTitle: 'Hot Pilates',    dayOfWeek: 5, hour: 9,  minute: 30, newTitle: 'Hot Mat Pilates (Strength)',           duration: 60 },
  { oldTitle: 'Hot Pilates',    dayOfWeek: 0, hour: 8,  minute: 0,  newTitle: 'Hot Mat Pilates (Sculpt/Strength/Core)', duration: 60 },
  { oldTitle: 'Special Forces', dayOfWeek: 2, hour: 19, minute: 0,  newTitle: 'Hot Mat Pilates (Core)',                 duration: 45 },
]

async function main() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  console.log('\n══ Hot Mat Pilates migration ══\n')

  for (const change of CHANGES) {
    const newServiceId = await getOrCreateService(change.newTitle, change.duration, 20)

    // Fetch all future sessions matching old title
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, start_time, service_id')
      .eq('title', change.oldTitle)
      .gte('start_time', today.toISOString())

    if (error) { console.error(`  Error fetching sessions for "${change.oldTitle}":`, error.message); continue }

    // Sessions are stored as "naive Melbourne time in UTC" — use UTC accessors to read the raw digits
    const targets = (sessions ?? []).filter(s => {
      const d = new Date(s.start_time)
      return d.getUTCDay() === change.dayOfWeek && d.getUTCHours() === change.hour && d.getUTCMinutes() === change.minute
    })

    if (targets.length === 0) {
      console.log(`  "${change.oldTitle}" (day ${change.dayOfWeek} ${change.hour}:${String(change.minute).padStart(2,'0')}) — no matching future sessions found`)
      continue
    }

    const ids = targets.map(s => s.id)
    const { error: updateError } = await supabase
      .from('sessions')
      .update({ title: change.newTitle, service_id: newServiceId })
      .in('id', ids)

    if (updateError) {
      console.error(`  Error updating sessions:`, updateError.message)
    } else {
      console.log(`  Updated ${ids.length} session(s): "${change.oldTitle}" → "${change.newTitle}"`)
    }
  }

  console.log('\n══ Done ══\n')
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
