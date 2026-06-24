// Shows all upcoming sessions in Melbourne time so we can spot wrong times
import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),
  (process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim()
)

const melb = (iso: string) => new Date(iso).toLocaleString('en-AU', {
  timeZone: 'Australia/Melbourne',
  weekday: 'short', day: 'numeric', month: 'short',
  hour: 'numeric', minute: '2-digit', hour12: true,
})

async function main() {
  const { data } = await db
    .from('sessions')
    .select('id, title, instructor_name, start_time, end_time, status')
    .gte('start_time', new Date().toISOString())
    .neq('status', 'CANCELLED')
    .order('start_time')
    .limit(200)

  if (!data?.length) { console.log('No upcoming sessions found'); return }

  let lastDay = ''
  for (const s of data) {
    const melbStr = melb(s.start_time)
    const day = melbStr.split(',')[0]
    if (day !== lastDay) { console.log('\n' + day.toUpperCase()); lastDay = day }
    console.log(`  ${melbStr.split(', ')[1]}  ${s.title.padEnd(30)} ${(s.instructor_name||'—').padEnd(15)}  ${s.id}`)
  }
}
main().catch(err => { console.error(err); process.exit(1) })
