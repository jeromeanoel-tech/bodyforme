import * as fs   from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) { const k = m[1].trim(), v = m[2].trim().replace(/^"|"$/g, ''); if (!process.env[k]) process.env[k] = v }
  }
}

const SUPA_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim()
const SUPA_KEY = (process.env.SUPABASE_SECRET_KEY     ?? '').replace(/\\n|\n/g, '').trim()
const db       = createClient(SUPA_URL, SUPA_KEY)
const stripe = new Stripe((process.env.STRIPE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim(), { apiVersion: '2024-04-10' as never })

async function main() {
  console.log('\n══ State check ══\n')

  // Raw counts — no column filtering that might cause an error
  const { data: members, error: mErr } = await db.from('members').select('id, email, status, stripe_customer_id, plan_override')
  console.log('members query error:', mErr?.message ?? 'none')
  console.log('members rows:       ', members?.length ?? 'null')
  if (members?.length) {
    const withId = members.filter((m: any) => m.stripe_customer_id).length
    console.log('  with customer_id: ', withId)
    console.log('  without:          ', members.length - withId)
    const statuses: Record<string, number> = {}
    members.forEach((m: any) => { statuses[m.status ?? 'null'] = (statuses[m.status ?? 'null'] ?? 0) + 1 })
    console.log('  statuses:         ', JSON.stringify(statuses))
    console.log('\nFirst 5 members:')
    members.slice(0, 5).forEach((m: any) => console.log(`  ${m.email} | ${m.status} | ${m.plan_override || '-'} | ${m.stripe_customer_id || 'NO CUST ID'}`))
  }

  const { data: memberships, error: msErr } = await db.from('memberships').select('id')
  console.log('\nmemberships error:', msErr?.message ?? 'none')
  console.log('memberships rows: ', memberships?.length ?? 'null')

  const { data: evts, error: evtErr } = await db.from('stripe_events').select('event_id')
  console.log('\nstripe_events error:', evtErr?.message ?? 'none')
  console.log('stripe_events rows: ', evts?.length ?? 'null')
  evts?.slice(0, 5).forEach((e: any) => console.log(' ', e.event_id))

  // Stripe side
  const custPage = await stripe.customers.list({ limit: 100 })
  console.log('\nStripe customers total:', custPage.data.length, custPage.has_more ? '(more exist)' : '')

  let activeSubs = 0
  const subPage = await stripe.subscriptions.list({ status: 'active', limit: 100 })
  activeSubs = subPage.data.length
  console.log('Stripe active subscriptions:', activeSubs)
  subPage.data.forEach(s => {
    const c = custPage.data.find(c => c.id === s.customer)
    console.log(`  ${s.id} | ${c?.email ?? s.customer} | ends ${new Date(s.current_period_end * 1000).toISOString().slice(0,10)}`)
  })

  console.log('\n══ Done ══\n')
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
