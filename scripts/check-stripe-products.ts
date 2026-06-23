import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient((process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),(process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim())
const stripe = new Stripe((process.env.STRIPE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim(),{apiVersion:'2024-04-10' as never})

async function main() {
  // Stripe products & prices
  console.log('\n── Stripe products & prices ────────────────────────')
  const products = await stripe.products.list({ limit: 100, active: true })
  for (const p of products.data) {
    const prices = await stripe.prices.list({ product: p.id, limit: 10 })
    for (const pr of prices.data) {
      const interval = pr.recurring ? `${pr.recurring.interval_count} ${pr.recurring.interval}` : 'one-time'
      console.log(`  ${p.name.padEnd(35)} ${String(pr.unit_amount ? pr.unit_amount/100 : 0).padStart(7)} AUD  ${interval.padEnd(12)}  ${pr.id}  ${pr.nickname ?? ''}`)
    }
  }

  // Plan distribution in DB
  console.log('\n── Plan distribution in DB ─────────────────────────')
  const { data: members } = await db.from('members').select('plan_override, status')
  const plans: Record<string, number> = {}
  members?.forEach((m:any) => {
    const k = m.plan_override || '(none)'
    plans[k] = (plans[k] ?? 0) + 1
  })
  Object.entries(plans).sort((a,b) => b[1]-a[1]).forEach(([p,n]) => console.log(`  ${n.toString().padStart(3)}  ${p}`))

  // Members with a plan but no subscription
  console.log('\n── Active members with plan but NO Stripe subscription ─')
  const { data: active } = await db.from('members').select('email, plan_override, stripe_customer_id').eq('status','active').neq('plan_override','')
  const allSubs: Record<string,boolean> = {}
  let subPage = await stripe.subscriptions.list({ status: 'active', limit: 100 })
  while (true) {
    subPage.data.forEach(s => { allSubs[s.customer as string] = true })
    if (!subPage.has_more) break
    subPage = await stripe.subscriptions.list({ status:'active', limit:100, starting_after: subPage.data[subPage.data.length-1].id })
  }
  const noSub = active?.filter((m:any) => !allSubs[m.stripe_customer_id]) ?? []
  console.log(`  ${noSub.length} active members with a plan but no Stripe subscription`)
  noSub.slice(0,10).forEach((m:any) => console.log(`  ${m.email.padEnd(40)} ${m.plan_override}`))
  if (noSub.length > 10) console.log(`  ... and ${noSub.length - 10} more`)
}
main().catch(err => { console.error(err); process.exit(1) })
