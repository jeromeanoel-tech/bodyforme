/**
 * Moves bookings from the old Friday 6:45 pm "60min Bikram Express" sessions
 * to the correct 6:15 pm session, then cancels the old sessions.
 *
 * Run: npx tsx scripts/move-bikram-bookings.ts
 */
import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),
  (process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim()
)

// Old 6:45 pm sessions (have active bookings, couldn't be auto-cancelled)
const OLD_IDS = [
  '492d81fa-d859-4287-aa5a-7927c3ef77c1',  // Mish
  'b202f372-c844-4d75-8f61-d026c7c19e5b',  // Gabe
]
// Correct 6:15 pm session
const NEW_ID = '68a4293d-0fa4-4af6-8f22-56e34c34ced4'

async function main() {
  console.log('\n══ Move Friday Bikram bookings: 6:45 pm → 6:15 pm ══\n')

  // 1. Fetch all confirmed bookings on the old sessions
  const { data: oldBookings, error: fetchErr } = await db.from('bookings')
    .select('id, session_id, member_id, status, members(first_name,last_name,email)')
    .in('session_id', OLD_IDS)
    .eq('status', 'CONFIRMED')

  if (fetchErr) { console.error('Fetch error:', fetchErr.message); process.exit(1) }
  console.log(`Old-session bookings to move: ${oldBookings?.length ?? 0}`)

  // 2. Fetch existing member_ids already booked on the new session (avoid duplicates)
  const { data: newBookings } = await db.from('bookings')
    .select('member_id').eq('session_id', NEW_ID).eq('status', 'CONFIRMED')
  const alreadyBooked = new Set((newBookings ?? []).map(b => b.member_id))
  console.log(`Already on 6:15 pm session: ${alreadyBooked.size}`)

  let moved = 0, skipped = 0

  for (const b of oldBookings ?? []) {
    const m = b.members as any
    const name = `${m?.first_name ?? ''} ${m?.last_name ?? ''}`.trim()

    if (alreadyBooked.has(b.member_id)) {
      // Member already has a booking on the correct session — just cancel the old one
      await db.from('bookings').update({ status: 'CANCELLED' }).eq('id', b.id)
      console.log(`  SKIP (already booked on 6:15 pm): ${name} — old booking cancelled`)
      skipped++
    } else {
      // Move: update the booking's session_id to the new session
      const { error } = await db.from('bookings').update({ session_id: NEW_ID }).eq('id', b.id)
      if (error) {
        console.warn(`  ⚠ Could not move booking ${b.id} for ${name}: ${error.message}`)
      } else {
        console.log(`  MOVED: ${name} <${m?.email}> → 6:15 pm`)
        alreadyBooked.add(b.member_id)
        moved++
      }
    }
  }

  // 3. Cancel the old sessions now that they have no more confirmed bookings
  const { data: remaining } = await db.from('bookings')
    .select('id', { count: 'exact', head: true })
    .in('session_id', OLD_IDS).eq('status', 'CONFIRMED')
  // @ts-ignore
  if ((remaining as any) === null || true) {
    const { count } = await db.from('bookings')
      .select('id', { count: 'exact', head: true })
      .in('session_id', OLD_IDS).eq('status', 'CONFIRMED')
    if ((count ?? 0) === 0) {
      await db.from('sessions').update({ status: 'CANCELLED' }).in('id', OLD_IDS)
      console.log('\nOld 6:45 pm sessions cancelled.')
    } else {
      console.log(`\n⚠ ${count} confirmed bookings remain on old sessions — not cancelled.`)
    }
  }

  console.log('\n── Result ──')
  console.log(`  Moved:   ${moved}`)
  console.log(`  Skipped: ${skipped} (already on correct session)`)
  console.log('\n══ Done ══\n')
}
main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
