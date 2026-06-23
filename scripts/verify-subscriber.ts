import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient((process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),(process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim())
async function main() {
  const {data} = await db.from('members').select('email,status,plan_override,end_date,next_billing_date,stripe_customer_id').eq('email','junipetberry@gmail.com').single()
  console.log('Active subscriber record:')
  console.log(JSON.stringify(data, null, 2))

  // Also show summary of members missing customer IDs
  const {data: noId} = await db.from('members').select('id,email').eq('stripe_customer_id','')
  console.log(`\nMembers still without customer ID (${noId?.length ?? 0}):`)
  noId?.forEach((m:any) => console.log(' ', m.email))
}
main().catch(err => { console.error(err); process.exit(1) })
