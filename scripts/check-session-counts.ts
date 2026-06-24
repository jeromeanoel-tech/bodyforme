import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),
  (process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim()
)
const TZ = 'Australia/Melbourne'

async function main() {
  // Fetch ALL future sessions — no limit
  const { data, error } = await db.from('sessions')
    .select('id, title, instructor_name, start_time, status, service_id')
    .neq('status', 'CANCELLED')
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(2000)

  if (error) { console.error(error.message); process.exit(1) }
  console.log(`Total non-cancelled future sessions: ${data?.length ?? 0}\n`)

  // Group by Melbourne weekday+time, count how many sessions exist across all weeks
  const slots: Record<string, { count: number; titles: Set<string>; instructors: Set<string> }> = {}
  for (const s of data ?? []) {
    const parts = new Intl.DateTimeFormat('en-AU', {
      timeZone: TZ, weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date(s.start_time))
    const wd = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? ''
    const h  = parts.find(p => p.type === 'hour')?.value   ?? '00'
    const mi = parts.find(p => p.type === 'minute')?.value ?? '00'
    const key = `${wd}|${h.padStart(2,'0')}:${mi.padStart(2,'0')}`
    if (!slots[key]) slots[key] = { count: 0, titles: new Set(), instructors: new Set() }
    slots[key].count++
    slots[key].titles.add(s.title)
    slots[key].instructors.add(s.instructor_name)
  }

  const DAY_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  const sorted = Object.entries(slots).sort(([a],[b]) => {
    const [da,ta] = a.split('|'), [db,tb] = b.split('|')
    const d = DAY_ORDER.indexOf(da) - DAY_ORDER.indexOf(db)
    return d !== 0 ? d : ta.localeCompare(tb)
  })

  for (const [key, v] of sorted) {
    const [day, time] = key.split('|')
    const weeksExpected = 12
    const flag = v.count > weeksExpected ? '⚠ EXTRA' : v.count < weeksExpected ? '⚠ MISSING' : '✓'
    const titles = [...v.titles].join(' / ')
    const instructors = [...v.instructors].join(' / ')
    console.log(`${flag}  ${day.padEnd(10)} ${time}  ×${v.count}  ${titles}  (${instructors})`)
  }
}
main().catch(err => { console.error(err); process.exit(1) })
