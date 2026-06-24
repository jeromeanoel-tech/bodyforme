import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),
  (process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim()
)
const DAY_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
async function main() {
  const { data } = await db.from('schedule_template').select('*')
  const sorted = (data??[]).sort((a,b)=>{
    const d = DAY_ORDER.indexOf(a.day)-DAY_ORDER.indexOf(b.day)
    return d!==0?d:a.start_time.localeCompare(b.start_time)
  })
  let lastDay = ''
  for (const r of sorted) {
    if (r.day !== lastDay) { console.log('\n'+r.day.toUpperCase()); lastDay = r.day }
    console.log(`  ${r.start_time}-${r.end_time}  ${r.class_name.padEnd(40)} ${(r.instructor||'—').padEnd(12)}  ${r.id}`)
  }
}
main().catch(err => { console.error(err); process.exit(1) })
