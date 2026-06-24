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
  const { data } = await db.from('sessions')
    .select('id, title, instructor_name, start_time, status, service_id')
    .neq('status','CANCELLED')
    .gte('start_time', new Date().toISOString())
    .order('start_time')
    .limit(2000)

  // Group by Melbourne date + HH:MM
  const bySlot: Record<string, {id:string,title:string}[]> = {}
  for (const s of data ?? []) {
    const d = new Date(s.start_time)
    const melbDate = new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
    const parts = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, hour:'2-digit', minute:'2-digit', hour12: false }).formatToParts(d)
    const h  = parts.find(p=>p.type==='hour')?.value??'00'
    const mi = parts.find(p=>p.type==='minute')?.value??'00'
    const key = `${melbDate}|${h.padStart(2,'0')}:${mi.padStart(2,'0')}`
    if (!bySlot[key]) bySlot[key] = []
    bySlot[key].push({ id: s.id, title: s.title })
  }

  let found = 0
  for (const [key, sessions] of Object.entries(bySlot)) {
    if (sessions.length > 1) {
      console.log(`DUPLICATE at ${key}:`)
      for (const s of sessions) console.log(`  ${s.id}  "${s.title}"`)
      found++
    }
  }
  if (found === 0) console.log('No duplicate non-cancelled sessions found on any date.')
  else console.log(`\n${found} duplicate slot(s) found.`)
}
main().catch(err => { console.error(err); process.exit(1) })
