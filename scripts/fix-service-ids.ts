/**
 * Fix sessions where service_id doesn't match the session's own title.
 *
 * The display uses scheduleToName[session.service_id] which looks up the service
 * NAME. If a session title was renamed (e.g. "Hot Mat Pilates" → "Hot Mat Pilates
 * (Strength)") but the service_id wasn't updated, the old service name shows
 * instead of the bracket detail.
 *
 * This script ensures every session's service_id points to the service whose
 * name exactly matches the session title.
 */

import * as fs   from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) {
      const k = m[1].trim(), v = m[2].trim().replace(/^"(.*)"$/, '$1').replace(/\\n$/, '')
      if (!process.env[k]) process.env[k] = v
    }
  }
}

const db = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY       ?? '').replace(/\\n|\n/g, '').trim(),
)

async function getOrCreateService(name: string, svcMap: Map<string, string>): Promise<string> {
  if (svcMap.has(name)) return svcMap.get(name)!
  // Look up in DB first (in case it was created by a previous iteration)
  const { data: rows } = await db.from('services').select('id').eq('name', name).limit(1)
  if (rows && rows.length > 0) { svcMap.set(name, rows[0].id); return rows[0].id }
  const { data: nw } = await db.from('services')
    .insert({ name, description: '', duration: 60, capacity: 20 }).select('id').single()
  if (!nw) throw new Error(`Could not create service "${name}"`)
  svcMap.set(name, nw.id)
  console.log(`  CREATED service: "${name}" → ${nw.id}`)
  return nw.id
}

async function main() {
  console.log('\n══ Fix session service_ids ══\n')

  // 1. Fetch all services
  const { data: services } = await db.from('services').select('id, name')
  const svcMap = new Map<string, string>()
  for (const s of services ?? []) svcMap.set(s.name, s.id)

  // 2. Fetch all future non-cancelled sessions
  const { data: sessions } = await db.from('sessions')
    .select('id, title, service_id')
    .neq('status', 'CANCELLED')
    .gte('start_time', new Date().toISOString())

  if (!sessions?.length) { console.log('No sessions found'); return }

  let fixed = 0, alreadyOk = 0

  for (const s of sessions) {
    const currentSvcName = svcMap.get(s.service_id)
    // Skip if the current service name already matches the session title
    // (We can't do a reverse lookup cheaply, so we check via the map)
    // Build a reverse map: service_id → name
    if (currentSvcName === s.title) { alreadyOk++; continue }

    // Find or create the correct service
    const correctId = await getOrCreateService(s.title, svcMap)

    if (correctId === s.service_id) { alreadyOk++; continue }

    const { error } = await db.from('sessions').update({ service_id: correctId }).eq('id', s.id)
    if (error) {
      console.warn(`  ⚠ Failed to update ${s.id}: ${error.message}`)
    } else {
      console.log(`  FIXED: "${s.title}"  ${currentSvcName ?? '(unknown)'} → ${correctId}`)
      fixed++
    }
  }

  console.log(`\n── Result ──`)
  console.log(`  Fixed:    ${fixed}`)
  console.log(`  Already correct: ${alreadyOk}`)
  console.log('\n══ Done ══\n')
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
