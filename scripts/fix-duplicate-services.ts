/**
 * Consolidates duplicate service records for the same class name.
 * 
 * Root cause: getOrCreateService used .maybeSingle() which errors when multiple
 * rows match, causing the create-branch to fire and add yet another duplicate.
 *
 * Fix:
 *   1. For each duplicate service group, keep the one with the most sessions.
 *   2. For sessions linked to a non-canonical service:
 *      - If the canonical service already has a session at that start_time → cancel the extra
 *      - If not → migrate the session's service_id to the canonical
 *   3. Delete the empty non-canonical service records.
 *
 * Run: npx tsx scripts/fix-duplicate-services.ts
 */
import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),
  (process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim()
)

async function main() {
  console.log('\n══ Fix duplicate service records ══\n')

  // 1. Find all duplicate service names
  const { data: services } = await db.from('services').select('id, name').order('name')
  const byName = new Map<string, string[]>()
  for (const s of services ?? []) {
    if (!byName.has(s.name)) byName.set(s.name, [])
    byName.get(s.name)!.push(s.id)
  }

  const dupes = [...byName.entries()].filter(([, ids]) => ids.length > 1)
  if (dupes.length === 0) { console.log('No duplicate service names found.'); return }

  for (const [name, ids] of dupes) {
    console.log(`\n── "${name}" — ${ids.length} duplicate records ──`)

    // Count active sessions per service to find the canonical one
    const counts = await Promise.all(ids.map(async id => {
      const { count } = await db.from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('service_id', id)
      return { id, count: count ?? 0 }
    }))
    counts.sort((a, b) => b.count - a.count)
    const canonical = counts[0]
    const nonCanonical = counts.slice(1)

    console.log(`  Canonical: ${canonical.id} (${canonical.count} sessions)`)
    for (const nc of nonCanonical) console.log(`  Extra:     ${nc.id} (${nc.count} sessions)`)

    // Get all sessions for non-canonical services
    const { data: extraSessions } = await db.from('sessions')
      .select('id, start_time, status')
      .in('service_id', nonCanonical.map(nc => nc.id))

    let migrated = 0, cancelled = 0

    for (const s of extraSessions ?? []) {
      // Check if canonical already has a session at this exact start_time
      const { data: conflict } = await db.from('sessions')
        .select('id')
        .eq('service_id', canonical.id)
        .eq('start_time', s.start_time)
        .maybeSingle()

      if (conflict) {
        // Conflict: cancel the extra session
        await db.from('sessions').update({ status: 'CANCELLED' }).eq('id', s.id)
        console.log(`    CANCEL (conflict): ${s.id.slice(0,8)} @ ${s.start_time}`)
        cancelled++
      } else {
        // No conflict: migrate service_id
        await db.from('sessions').update({ service_id: canonical.id }).eq('id', s.id)
        console.log(`    MIGRATE: ${s.id.slice(0,8)} @ ${s.start_time}`)
        migrated++
      }
    }

    // Delete the now-empty non-canonical service records
    const toDelete = nonCanonical.map(nc => nc.id)
    const { error: delErr } = await db.from('services').delete().in('id', toDelete)
    if (delErr) console.warn(`    ⚠ Could not delete service records: ${delErr.message}`)
    else console.log(`    Deleted ${toDelete.length} duplicate service records.`)

    console.log(`    Result: ${migrated} migrated, ${cancelled} cancelled`)
  }

  console.log('\n══ Done ══\n')
}
main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
