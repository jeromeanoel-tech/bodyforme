import * as fs from 'fs'; import * as path from 'path'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|\"/g,'');if(!process.env[k])process.env[k]=v}}}
import Stripe from 'stripe'

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim(), { apiVersion: '2024-04-10' as never })

async function main() {
  const products = await stripe.products.list({ active: true, limit: 100 })
  const pos = products.data.filter((p: any) => p.metadata?.pos === 'true')
  console.log(`Found ${pos.length} POS products in Stripe:`)
  for (const p of pos) {
    console.log(`  name="${p.name}"  planName="${p.metadata?.planName ?? '(none)'}"  memberAction="${p.metadata?.memberAction ?? ''}"`)
  }
}
main().catch(console.error)
