import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),
  (process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim()
)
async function main() {
  const { data: services } = await db.from('services').select('id, name').order('name')
  console.log('\n── All services (' + (services?.length??0) + ' rows) ──')
  const seen = new Map<string, string[]>()
  for (const s of services??[]) {
    if (!seen.has(s.name)) seen.set(s.name, [])
    seen.get(s.name)!.push(s.id)
  }
  for (const [name, ids] of seen) {
    const flag = ids.length > 1 ? '⚠ DUPLICATE' : '✓'
    console.log(`${flag}  "${name}"  (${ids.length} records)`)
    if (ids.length > 1) for (const id of ids) {
      const { count } = await db.from('sessions').select('id',{count:'exact',head:true}).eq('service_id',id).neq('status','CANCELLED')
      console.log(`     ${id}  → ${count} active sessions`)
    }
  }
}
main().catch(err => { console.error(err); process.exit(1) })
