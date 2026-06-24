/**
 * Resyncs the sessions table to match the canonical weekly timetable.
 *
 * For each future session:
 *   - If it matches a canonical slot → keep / update title+instructor if needed
 *   - If no matching slot at that Melbourne day+time → cancel (if no active bookings)
 *
 * For each canonical slot without sessions → seeds 12 weeks of sessions.
 *
 * Run: npx tsx scripts/resync-schedule.ts
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

const TZ = 'Australia/Melbourne'

// ── Canonical weekly timetable ────────────────────────────────────────────────
// end is optional — defaults to start + 60min if not set
// day: lowercase full weekday name

interface Slot {
  day:        string
  start:      string  // HH:MM 24h
  end:        string  // HH:MM 24h
  className:  string
  instructor: string
}

const TIMETABLE: Slot[] = [
  // Monday
  { day: 'monday',    start: '09:30', end: '10:30', className: 'Hot Mat Pilates',                    instructor: 'Suzanne' },
  { day: 'monday',    start: '17:45', end: '18:45', className: 'Hot Mat Pilates',                    instructor: 'Sammy' },
  { day: 'monday',    start: '19:00', end: '20:30', className: '90min Bikram (Hot Yoga)',             instructor: 'Gabe' },
  // Tuesday
  { day: 'tuesday',   start: '09:30', end: '10:30', className: 'Arms Abs Glutes',                    instructor: 'Suzanne' },
  { day: 'tuesday',   start: '17:45', end: '18:45', className: 'Arms Abs Glutes',                    instructor: 'Suzanne' },
  { day: 'tuesday',   start: '19:00', end: '19:45', className: 'Hot Mat Pilates (Core)',              instructor: 'Suzanne' },
  // Wednesday
  { day: 'wednesday', start: '06:30', end: '07:15', className: 'Arms Abs Glutes',                    instructor: 'Mash' },
  { day: 'wednesday', start: '09:30', end: '10:30', className: 'Hot Mat Pilates',                    instructor: 'Suzanne' },
  { day: 'wednesday', start: '17:45', end: '18:45', className: 'Hot Mat',                            instructor: 'Hiliory' },
  { day: 'wednesday', start: '19:00', end: '19:45', className: 'Power HIIT',                         instructor: 'Hiliory' },
  // Thursday
  { day: 'thursday',  start: '09:30', end: '10:15', className: 'Tabata',                             instructor: 'Suzanne' },
  { day: 'thursday',  start: '17:45', end: '18:30', className: 'Tabata',                             instructor: 'Suzanne' },
  { day: 'thursday',  start: '18:45', end: '19:45', className: 'Arms Abs Glutes',                    instructor: 'Mish' },
  // Friday
  { day: 'friday',    start: '06:30', end: '07:15', className: 'Power HIIT',                         instructor: 'Mish' },
  { day: 'friday',    start: '09:30', end: '10:30', className: 'Hot Mat Pilates (Strength)',          instructor: 'Sammy' },
  { day: 'friday',    start: '18:15', end: '19:15', className: '60min Bikram Express (Hot Yoga)',     instructor: 'Gabe' },
  // Saturday
  { day: 'saturday',  start: '08:00', end: '09:00', className: 'Sculpt Yoga',                        instructor: 'Stephanie' },
  { day: 'saturday',  start: '09:15', end: '10:15', className: 'Hot Mat Pilates',                    instructor: 'Sammy' },
  { day: 'saturday',  start: '15:30', end: '16:30', className: 'Silent Bikram',                      instructor: 'Mish' },
  // Sunday
  { day: 'sunday',    start: '08:00', end: '09:00', className: 'Hot Mat Pilates (Sculpt/Strength/Core)', instructor: 'Suzanne' },
  { day: 'sunday',    start: '09:15', end: '10:45', className: '90min Bikram (Hot Yoga)',             instructor: 'Mish' },
  { day: 'sunday',    start: '17:00', end: '18:00', className: 'Yin Yoga',                           instructor: 'Sammy' },
]

// ── Melbourne time helpers ────────────────────────────────────────────────────

function getMelbDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
}

function getMelbOffset(melbDateStr: string): number {
  const probe = new Date(`${melbDateStr}T02:00:00Z`)
  const melbH = parseInt(
    new Intl.DateTimeFormat('en-AU', { timeZone: TZ, hour: '2-digit', hour12: false }).format(probe), 10,
  )
  return melbH - 2
}

function toUTC(melbDateStr: string, hhmm: string): string {
  const [h, m]  = hhmm.split(':').map(Number)
  const offsetH = getMelbOffset(melbDateStr)
  const utcH    = h - offsetH
  if (utcH >= 0) {
    return `${melbDateStr}T${String(utcH).padStart(2,'0')}:${String(m).padStart(2,'0')}:00.000Z`
  }
  const prev = new Date(`${melbDateStr}T00:00:00Z`)
  prev.setUTCDate(prev.getUTCDate() - 1)
  return `${prev.toISOString().slice(0,10)}T${String(24+utcH).padStart(2,'0')}:${String(m).padStart(2,'0')}:00.000Z`
}

function getMelbDayTime(iso: string): { day: string; hhmm: string } {
  const d = new Date(iso)
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: TZ, weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d)
  const day  = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? ''
  const h    = parts.find(p => p.type === 'hour')?.value   ?? '00'
  const mi   = parts.find(p => p.type === 'minute')?.value ?? '00'
  return { day, hhmm: `${h.padStart(2,'0')}:${mi.padStart(2,'0')}` }
}

// ── Service record helpers ────────────────────────────────────────────────────

const svcCache = new Map<string, string>()

async function getOrCreateService(name: string): Promise<string> {
  if (svcCache.has(name)) return svcCache.get(name)!
  const { data: ex } = await db.from('services').select('id').eq('name', name).maybeSingle()
  if (ex) { svcCache.set(name, ex.id); return ex.id }
  const { data: nw } = await db.from('services')
    .insert({ name, description: '', duration: 60, capacity: 20 }).select('id').single()
  if (!nw) throw new Error(`Could not create service "${name}"`)
  svcCache.set(name, nw.id)
  return nw.id
}

// ── Monday of current Melbourne week ─────────────────────────────────────────

const DOW_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']

function getMelbMonday(): string {
  const todayMelb = getMelbDate()
  const dow = new Date(`${todayMelb}T12:00:00Z`).getUTCDay()
  const diff = dow === 0 ? -6 : 1 - dow
  const d = new Date(`${todayMelb}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + diff)
  return d.toISOString().slice(0, 10)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══ BodyForme: schedule resync ══\n')

  // 1. Fetch all future sessions (including cancelled ones for dedup)
  const { data: allFuture } = await db.from('sessions')
    .select('id, title, instructor_name, start_time, end_time, status, service_id')
    .gt('start_time', new Date().toISOString())
    .order('start_time')

  const sessions = allFuture ?? []
  console.log(`Found ${sessions.length} future sessions (including cancelled)`)

  let updated = 0, cancelled = 0, created = 0, skipped = 0

  // 2. For each existing future session, check if it matches a canonical slot
  for (const s of sessions) {
    if (s.status === 'CANCELLED') continue  // already cancelled, skip

    const { day, hhmm } = getMelbDayTime(s.start_time)
    const canon = TIMETABLE.find(t => t.day === day && t.start === hhmm)

    if (!canon) {
      // No canonical slot at this Melbourne day+time — check for bookings
      const { count } = await db.from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', s.id)
        .eq('status', 'CONFIRMED')
      if ((count ?? 0) > 0) {
        console.log(`  SKIP (has bookings): ${day} ${hhmm} "${s.title}"`)
        skipped++
      } else {
        await db.from('sessions').update({ status: 'CANCELLED' }).eq('id', s.id)
        console.log(`  CANCEL: ${day} ${hhmm} "${s.title}"`)
        cancelled++
      }
    } else if (s.title !== canon.className || s.instructor_name !== canon.instructor) {
      // Slot exists but wrong title or instructor — update in-place
      await db.from('sessions').update({ title: canon.className, instructor_name: canon.instructor }).eq('id', s.id)
      console.log(`  UPDATE: ${day} ${hhmm} "${s.title}" → "${canon.className}" / ${s.instructor_name} → ${canon.instructor}`)
      updated++
    }
  }

  // 3. Refetch the current DB state (phase 2 may have mutated titles/statuses)
  const { data: freshData } = await db.from('sessions')
    .select('id, title, instructor_name, start_time, end_time, status, service_id')
    .gt('start_time', new Date().toISOString())
    .order('start_time')
  const freshSessions = freshData ?? []

  // 4. Dedup: cancel extra sessions where multiple non-cancelled sessions share the
  //    same Melbourne calendar-date + HH:MM. Keep the one that matches the canonical
  //    slot; cancel the rest (unless they have active bookings).
  console.log('\n── Phase 4: dedup ──')
  const seen = new Map<string, string>() // "YYYY-MM-DD|HH:MM" → session id to keep
  const dupCancelled: string[] = []

  for (const s of freshSessions) {
    if (s.status === 'CANCELLED') continue
    const { day, hhmm } = getMelbDayTime(s.start_time)
    const melbDate = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date(s.start_time))
    const key = `${melbDate}|${hhmm}`
    const canon = TIMETABLE.find(t => t.day === day && t.start === hhmm)
    const isCanonical = canon && s.title === canon.className && s.instructor_name === canon.instructor

    if (!seen.has(key)) {
      // Prefer to keep the canonical match; otherwise keep whatever we see first
      seen.set(key, s.id)
      if (isCanonical) seen.set(key, s.id)  // mark as canonical
    } else {
      // A session at this slot is already marked to keep — this one is a duplicate
      // Unless the kept one is NOT canonical and this one IS
      const keepId = seen.get(key)!
      const keepSession = freshSessions.find(x => x.id === keepId)
      const keepIsCanonical = canon &&
        keepSession?.title === canon.className &&
        keepSession?.instructor_name === canon.instructor

      const toCancelId = keepIsCanonical ? s.id : keepId
      if (!keepIsCanonical && isCanonical) seen.set(key, s.id)

      // Check for bookings before cancelling
      const { count } = await db.from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', toCancelId).eq('status', 'CONFIRMED')
      if ((count ?? 0) > 0) {
        console.log(`  SKIP DUP (has bookings): ${day} ${hhmm} id=${toCancelId}`)
      } else {
        await db.from('sessions').update({ status: 'CANCELLED' }).eq('id', toCancelId)
        console.log(`  CANCEL DUP: ${day} ${hhmm} id=${toCancelId}`)
        dupCancelled.push(toCancelId)
        cancelled++
      }
    }
  }

  // 5. Seed missing sessions for each canonical slot
  const monday = getMelbMonday()

  for (const slot of TIMETABLE) {
    const targetDow = DOW_ORDER.indexOf(slot.day)
    const mondayDow = new Date(`${monday}T12:00:00Z`).getUTCDay()
    const diffToSlot = (targetDow - mondayDow + 7) % 7
    const serviceId = await getOrCreateService(slot.className)

    for (let week = 0; week < 12; week++) {
      const d = new Date(`${monday}T12:00:00Z`)
      d.setUTCDate(d.getUTCDate() + diffToSlot + week * 7)
      const melbDate  = d.toISOString().slice(0, 10)
      const startISO  = toUTC(melbDate, slot.start)
      const endISO    = toUTC(melbDate, slot.end)

      // Use the fresh post-phase-2 state; also exclude anything we just cancelled
      const existingActive = freshSessions.find(s =>
        s.start_time.startsWith(startISO.slice(0, 19)) &&
        s.status !== 'CANCELLED' &&
        !dupCancelled.includes(s.id)
      )

      if (existingActive) continue  // at least one active session at this slot — good

      // Check for a cancelled session we can restore
      const existingCancelled = freshSessions.find(s =>
        s.start_time.startsWith(startISO.slice(0, 19)) &&
        s.title === slot.className
      )
      if (existingCancelled) {
        await db.from('sessions').update({ status: 'CONFIRMED', instructor_name: slot.instructor, end_time: endISO }).eq('id', existingCancelled.id)
        console.log(`  RESTORE: ${slot.day} ${slot.start} "${slot.className}"`)
        created++
        continue
      }

      // Also check by service_id + start_time (DB unique key)
      const { data: byKey } = await db.from('sessions')
        .select('id, status').eq('service_id', serviceId).eq('start_time', startISO).maybeSingle()
      if (byKey) {
        if (byKey.status === 'CANCELLED') {
          await db.from('sessions').update({ status: 'CONFIRMED', title: slot.className, instructor_name: slot.instructor }).eq('id', byKey.id)
          created++
        }
        continue
      }

      const { error } = await db.from('sessions').insert({
        service_id:      serviceId,
        title:           slot.className,
        instructor_name: slot.instructor,
        start_time:      startISO,
        end_time:        endISO,
        capacity:        20,
        status:          'CONFIRMED',
      })
      if (error) console.warn(`  ⚠ ${slot.className} ${startISO}: ${error.message}`)
      else { console.log(`  CREATE: ${slot.day} ${slot.start} "${slot.className}"`); created++ }
    }
  }

  console.log('\n── Result ──────────────────────────────────')
  console.log(`  Updated (title/instructor fix):  ${updated}`)
  console.log(`  Cancelled (no matching slot):    ${cancelled}`)
  console.log(`  Skipped (has active bookings):   ${skipped}`)
  console.log(`  Created / restored:              ${created}`)
  console.log('\n══ Done ══\n')
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
