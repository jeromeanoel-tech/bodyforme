import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),
  (process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim()
)
const TZ = 'Australia/Melbourne'
function melbTime(iso: string) {
  return new Date(iso).toLocaleString('en-AU',{timeZone:TZ,weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit',hour12:true})
}
async function main() {
  // The 4 non-canonical Arms Abs Glutes service IDs (anything except 195026e4 which has 50 sessions)
  const nonCanonical = [
    '0c9a5750-7839-4e97-81d3-1df4697d3a79',
    '5f98695a-b57e-433f-b687-4102e2565fd7',
    'a47f856b-3a52-4867-a0c7-d3cc5163c82f',
    '31453821-e84a-42c9-bd37-71bb5919d03a',
  ]
  const { data } = await db.from('sessions')
    .select('id, title, start_time, status, service_id')
    .in('service_id', nonCanonical)
    .order('start_time')
  console.log(`\nSessions on non-canonical "Arms Abs Glutes" services: ${data?.length}\n`)
  for (const s of data??[]) {
    console.log(`  [${s.status}]  ${melbTime(s.start_time).padEnd(35)}  svc=${s.service_id.slice(0,8)}  ${s.id.slice(0,8)}`)
  }
}
main().catch(err => { console.error(err); process.exit(1) })
