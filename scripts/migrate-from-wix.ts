/**
 * Full Wix → Supabase migration script.
 * Run once from the project root:
 *
 *   npx tsx scripts/migrate-from-wix.ts
 *
 * What it migrates:
 *   1. Members       — Wix Contacts + MemberCredentials collection (includes bcrypt hashes)
 *   2. Services      — Wix booking service types (Hot Yoga, Pilates, etc.)
 *   3. Sessions      — class schedule, last 12 months + next 6 months
 *   4. Bookings      — who booked which session
 *   5. Memberships   — active pricing plan orders
 *
 * Safe to re-run — all inserts use upsert / skip-on-conflict.
 */

import * as fs   from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'

// ── Load .env.local ───────────────────────────────────────────────────────────

const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) {
      const key = m[1].trim()
      const val = m[2].trim().replace(/^"(.*)"$/, '$1')
      if (!process.env[key]) process.env[key] = val
    }
  }
}

const WIX_SITE_ID = process.env.WIX_SITE_ID!
const WIX_API_KEY = process.env.WIX_API_KEY!
const BASE        = 'https://www.wixapis.com'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

// ── Wix fetch helpers ─────────────────────────────────────────────────────────

function wixHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization:  WIX_API_KEY,
    'wix-site-id':  WIX_SITE_ID,
  }
}

async function wixPost(path: string, body: object): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}${path}`, {
    method:  'POST',
    headers: wixHeaders(),
    body:    JSON.stringify(body),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Wix POST ${path} → ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<Record<string, unknown>>
}

async function wixGet(path: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}${path}`, { headers: wixHeaders() })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Wix GET ${path} → ${res.status}: ${text.slice(0, 200)}`)
  }
  return res.json() as Promise<Record<string, unknown>>
}

// Paginate through a Wix query endpoint using cursor pagination.
// Different Wix APIs return pagination under 'pagingMetadata' or 'metadata'.
async function wixQueryAll<T>(
  endpoint:  string,
  body:      Record<string, unknown>,
  extractFn: (data: Record<string, unknown>) => T[],
  pageSize = 200,
): Promise<T[]> {
  const results: T[] = []
  let cursor: string | undefined

  for (;;) {
    const payload = {
      ...body,
      query: {
        ...(body.query as object ?? {}),
        paging: cursor ? { limit: pageSize, cursor } : { limit: pageSize },
      },
    }
    const data  = await wixPost(endpoint, payload)
    const items = extractFn(data)
    results.push(...items)

    // Wix uses 'pagingMetadata' or 'metadata' depending on the API version
    const meta    = (data.pagingMetadata ?? data.metadata) as Record<string, unknown> ?? {}
    const cursors = meta.cursors as Record<string, string> ?? {}
    const hasMore = (meta.hasNext ?? meta.hasMore) as boolean ?? false
    cursor        = cursors.next

    if (!hasMore || !cursor || items.length === 0) break
  }
  return results
}

// ── Phase 1: Fetch from Wix ───────────────────────────────────────────────────

async function fetchStaff(): Promise<Record<string, string>> {
  // Returns map: resourceId → name
  console.log('  Fetching staff members…')
  try {
    const data = await wixPost('/bookings/v1/staff-members/query', {
      query: { paging: { limit: 100 } },
    })
    const map: Record<string, string> = {}
    for (const s of (data.staffMembers as Record<string, string>[] ?? [])) {
      map[s.resourceId] = s.name
    }
    return map
  } catch (e) {
    console.warn('  ⚠ Could not fetch staff:', e)
    return {}
  }
}

type WixService = { id: string; name: string; description: string; duration: number; capacity: number }

async function fetchServices(): Promise<WixService[]> {
  console.log('  Fetching services…')
  return wixQueryAll(
    '/bookings/v2/services/query',
    { query: {} },
    data => (data.services as Record<string, unknown>[] ?? []).map(s => ({
      id:          s.id as string,
      name:        s.name as string ?? '',
      description: (s.description as string) ?? '',
      duration:    (s.defaultCapacity as number) ?? 60,
      capacity:    (s.defaultCapacity as number) ?? 10,
    })),
  )
}

type WixContact = {
  id: string; firstName: string; lastName: string
  email: string; phone: string; createdAt: string
}

async function fetchContacts(): Promise<WixContact[]> {
  console.log('  Fetching contacts (paginated)…')
  const results: WixContact[] = []
  let cursor: string | undefined

  for (;;) {
    const payload = {
      query: {
        sort:   [{ fieldName: 'createdDate', order: 'ASC' }],
        paging: cursor ? { limit: 200, cursor } : { limit: 200 },
      },
    }
    const data = await wixPost('/contacts/v4/contacts/query', payload)

    // Debug first page to understand pagination shape
    if (!cursor) {
      const meta = data.pagingMetadata ?? data.metadata
      console.log(`  Contacts page 1 — total: ${(data.contacts as unknown[])?.length ?? 0}, meta keys: ${JSON.stringify(Object.keys(meta as object ?? {}))}`)
    }

    const contacts = (data.contacts as Record<string, unknown>[] ?? []).map(c => {
      const info        = (c.info as Record<string, unknown>) ?? {}
      const name        = (info.name as Record<string, string>) ?? {}
      const primaryInfo = (c.primaryInfo as Record<string, string>) ?? {}
      return {
        id:        c.id as string,
        firstName: name.first  ?? '',
        lastName:  name.last   ?? '',
        email:     primaryInfo.email ?? '',
        phone:     primaryInfo.phone ?? '',
        createdAt: (c.createdDate as string) ?? new Date().toISOString(),
      }
    })
    results.push(...contacts)

    const meta    = (data.pagingMetadata ?? data.metadata) as Record<string, unknown> ?? {}
    const cursors = meta.cursors as Record<string, string> ?? {}
    const hasMore = (meta.hasNext ?? meta.hasMore) as boolean ?? false
    cursor        = cursors.next

    if (!hasMore || !cursor || contacts.length === 0) break
  }
  console.log(`  Total contacts fetched: ${results.length}`)
  return results
}

type WixCredential = {
  _id: string; email: string; passwordHash: string
  firstName: string; lastName: string; phone: string; suburb: string
  status: string; wixContactId: string; stripeCustomerId: string
  planOverride: string; nextBillingDate: string; creditBalance: number; adminNotes: string
}

async function fetchMemberCredentials(): Promise<WixCredential[]> {
  console.log('  Fetching MemberCredentials collection…')
  try {
    const results: WixCredential[] = []
    let cursor: string | undefined
    for (;;) {
      const payload = {
        dataCollectionId: 'MemberCredentials',
        query: { paging: cursor ? { limit: 200, cursor } : { limit: 200 } },
      }
      const res = await fetch(`${BASE}/wix-data/v2/items/query`, {
        method:  'POST',
        headers: { ...wixHeaders(), 'wix-suppress-auth': 'true' },
        body:    JSON.stringify(payload),
      })
      if (!res.ok) {
        console.warn('  ⚠ MemberCredentials not accessible (status', res.status, ')— contacts only')
        return []
      }
      const data   = await res.json() as Record<string, unknown>
      const items  = (data.dataItems as Record<string, unknown>[] ?? [])
      for (const item of items) {
        const d    = (item.data as Record<string, unknown>) ?? {}
        results.push({
          _id:              item.id as string,
          email:            d.email            as string ?? '',
          passwordHash:     d.passwordHash     as string ?? '',
          firstName:        d.firstName        as string ?? '',
          lastName:         d.lastName         as string ?? '',
          phone:            d.phone            as string ?? '',
          suburb:           d.suburb           as string ?? '',
          status:           d.status           as string ?? 'active',
          wixContactId:     d.wixContactId     as string ?? '',
          stripeCustomerId: d.stripeCustomerId as string ?? '',
          planOverride:     d.planOverride     as string ?? '',
          nextBillingDate:  d.nextBillingDate  as string ?? '',
          creditBalance:    Number(d.creditBalance ?? 0),
          adminNotes:       d.adminNotes       as string ?? '',
        })
      }
      const meta    = data.pagingMetadata as Record<string, unknown> ?? {}
      const cursors = meta.cursors as Record<string, string> ?? {}
      if (!meta.hasNext || !cursors.next || items.length === 0) break
      cursor = cursors.next
    }
    return results
  } catch (e) {
    console.warn('  ⚠ Could not fetch MemberCredentials:', e)
    return []
  }
}

type WixSession = {
  id: string; title: string; start: string; end: string
  capacity: number; staffResourceId: string; serviceId: string; status: string
}

async function fetchSessions(): Promise<WixSession[]> {
  // Fetch last 12 months + next 6 months in 3-month chunks to stay within paging limits
  const ranges: [string, string][] = []
  const now    = new Date()
  const start  = new Date(now); start.setMonth(start.getMonth() - 12)
  const finish = new Date(now); finish.setMonth(finish.getMonth() + 6)

  let cur = new Date(start)
  while (cur < finish) {
    const next = new Date(cur); next.setMonth(next.getMonth() + 3)
    ranges.push([cur.toISOString().slice(0, 10), next.toISOString().slice(0, 10)])
    cur = next
  }

  console.log(`  Fetching sessions across ${ranges.length} date ranges…`)
  const all: WixSession[] = []
  const seen = new Set<string>()

  for (const [from, to] of ranges) {
    try {
      const data = await wixPost('/calendar/v3/events/query', {
        fromLocalDate: from + 'T00:00:00',
        toLocalDate:   to   + 'T23:59:59',
        query: { paging: { limit: 200 } },
      })
      for (const e of (data.events as Record<string, unknown>[] ?? [])) {
        if (seen.has(e.id as string)) continue
        seen.add(e.id as string)
        const resources = (e.resources as Record<string, string>[] ?? [])
        const startObj  = (e.start as Record<string, string>) ?? {}
        const endObj    = (e.end   as Record<string, string>) ?? {}
        all.push({
          id:              e.id as string,
          title:           (e.title as string) ?? '',
          start:           startObj.localDate ?? '',
          end:             endObj.localDate   ?? '',
          capacity:        (e.totalCapacity as number) ?? 10,
          staffResourceId: resources[0]?.id ?? '',
          serviceId:       (e.scheduleId as string) ?? '',
          status:          (e.status as string) ?? 'CONFIRMED',
        })
      }
    } catch (e) {
      console.warn(`  ⚠ Sessions ${from}→${to}:`, e)
    }
  }
  return all
}

type WixBooking = {
  id: string; contactId: string; eventId: string; status: string
}

async function fetchBookings(contacts: WixContact[]): Promise<WixBooking[]> {
  // Wix doesn't support querying all bookings without a filter, so fetch per-contact
  console.log(`  Fetching bookings for ${contacts.length} contacts…`)
  const all: WixBooking[] = []
  let done = 0

  for (const contact of contacts) {
    if (!contact.id) continue
    try {
      const data = await wixPost('/bookings/v2/bookings/query', {
        query: {
          filter: { contactId: contact.id },
          sort:   [{ fieldName: 'createdDate', order: 'DESC' }],
          paging: { limit: 100 },
        },
      })
      for (const b of (data.bookings as Record<string, unknown>[] ?? [])) {
        const entity = (b.bookedEntity as Record<string, unknown>) ?? {}
        const event  = (entity.event  as Record<string, string>)  ?? {}
        all.push({
          id:        b.id as string,
          contactId: contact.id,
          eventId:   event.eventId ?? '',
          status:    (b.status as string) ?? 'CONFIRMED',
        })
      }
    } catch {
      // skip this contact's bookings silently
    }
    done++
    if (done % 50 === 0) process.stdout.write(`  … ${done}/${contacts.length} contacts checked\n`)
  }
  return all
}

type WixMembership = {
  id: string; contactId: string; planId: string; planName: string
  status: string; startDate: string; endDate: string
}

async function fetchMemberships(): Promise<WixMembership[]> {
  console.log('  Fetching memberships…')
  try {
    return await wixQueryAll(
      '/pricing-plans/v2/orders/query',
      { query: {} },
      data => (data.orders as Record<string, unknown>[] ?? []).map(o => {
        const buyer = (o.buyer as Record<string, string>) ?? {}
        return {
          id:        o.id        as string,
          contactId: buyer.contactId ?? '',
          planId:    o.planId    as string ?? '',
          planName:  o.planName  as string ?? '',
          status:    o.status    as string ?? '',
          startDate: o.startDate as string ?? '',
          endDate:   o.endDate   as string ?? '',
        }
      }),
    )
  } catch (e) {
    console.warn('  ⚠ Could not fetch memberships:', e)
    return []
  }
}

// ── Phase 2: Insert into Supabase ─────────────────────────────────────────────

async function insertMembers(
  contacts:    WixContact[],
  credentials: WixCredential[],
): Promise<Map<string, string>> {
  // Returns map: wixContactId → supabase member UUID
  console.log(`  Inserting ${contacts.length} members…`)

  const credsByEmail       = new Map(credentials.map(c => [c.email.toLowerCase(), c]))
  const credsByContactId   = new Map(credentials.map(c => [c.wixContactId, c]))
  const wixToSupabase      = new Map<string, string>()

  // Use a placeholder hash that can never match any real password
  const LOCKED = '$2b$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'

  let inserted = 0
  let skipped  = 0

  for (const contact of contacts) {
    if (!contact.email) { skipped++; continue }

    const cred = credsByContactId.get(contact.id) ?? credsByEmail.get(contact.email.toLowerCase())

    const row = {
      email:              contact.email.toLowerCase(),
      password_hash:      cred?.passwordHash     || LOCKED,
      first_name:         cred?.firstName        || contact.firstName,
      last_name:          cred?.lastName         || contact.lastName,
      phone:              cred?.phone            || contact.phone || '',
      suburb:             cred?.suburb           || '',
      status:             cred?.status           || 'active',
      stripe_customer_id: cred?.stripeCustomerId || '',
      plan_override:      cred?.planOverride     || '',
      next_billing_date:  cred?.nextBillingDate  || '',
      credit_balance:     cred?.creditBalance    || 0,
      admin_notes:        cred?.adminNotes       || '',
    }

    const { data, error } = await supabase
      .from('members')
      .upsert(row, { onConflict: 'email', ignoreDuplicates: false })
      .select('id')
      .single()

    if (error) {
      console.warn(`  ⚠ Member ${contact.email}:`, error.message)
      skipped++
    } else {
      wixToSupabase.set(contact.id, data.id)
      inserted++
    }
  }

  // Also map credentials that had a wixContactId but no matching contact in list
  for (const cred of credentials) {
    if (cred.wixContactId && !wixToSupabase.has(cred.wixContactId) && cred.email) {
      const { data } = await supabase
        .from('members')
        .select('id')
        .eq('email', cred.email.toLowerCase())
        .single()
      if (data) wixToSupabase.set(cred.wixContactId, data.id)
    }
  }

  console.log(`  ✓ Members: ${inserted} inserted/updated, ${skipped} skipped (no email)`)
  return wixToSupabase
}

async function insertServices(services: WixService[]): Promise<Map<string, string>> {
  // Returns map: wixServiceId → supabase service UUID
  console.log(`  Inserting ${services.length} services…`)
  const map = new Map<string, string>()

  for (const svc of services) {
    // Check if a service with this name already exists
    const { data: existing } = await supabase
      .from('services')
      .select('id')
      .eq('name', svc.name)
      .single()

    if (existing) {
      map.set(svc.id, existing.id)
      continue
    }

    const { data, error } = await supabase
      .from('services')
      .insert({ name: svc.name, description: svc.description, duration: svc.duration, capacity: svc.capacity })
      .select('id')
      .single()
    if (error) {
      console.warn(`  ⚠ Service ${svc.name}:`, error.message)
    } else {
      map.set(svc.id, data.id)
    }
  }
  console.log(`  ✓ Services: ${map.size} found/inserted`)
  return map
}

async function insertSessions(
  sessions:    WixSession[],
  serviceMap:  Map<string, string>,
  staffMap:    Record<string, string>,
): Promise<Map<string, string>> {
  // Returns map: wixSessionId → supabase session UUID
  console.log(`  Inserting ${sessions.length} sessions…`)
  const map = new Map<string, string>()
  let inserted = 0; let skipped = 0

  for (const s of sessions) {
    if (!s.start || !s.end) { skipped++; continue }

    const instructorName = staffMap[s.staffResourceId] ?? ''
    const serviceId      = serviceMap.get(s.serviceId) ?? null

    const row = {
      title:           s.title,
      instructor_name: instructorName,
      start_time:      s.start.length === 19 ? s.start + 'Z' : s.start,
      end_time:        s.end.length   === 19 ? s.end   + 'Z' : s.end,
      capacity:        s.capacity || 10,
      status:          s.status,
      service_id:      serviceId,
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert(row)
      .select('id')
      .single()

    if (error) {
      // Likely already exists — look it up by title + start_time
      const { data: existing } = await supabase
        .from('sessions')
        .select('id')
        .eq('title', s.title)
        .eq('start_time', row.start_time)
        .single()
      if (existing) { map.set(s.id, existing.id); skipped++ }
      else { console.warn(`  ⚠ Session ${s.title} @ ${s.start}:`, error.message); skipped++ }
    } else {
      map.set(s.id, data.id); inserted++
    }
  }

  console.log(`  ✓ Sessions: ${inserted} inserted, ${skipped} skipped/existing`)
  return map
}

async function insertBookings(
  bookings:   WixBooking[],
  memberMap:  Map<string, string>,
  sessionMap: Map<string, string>,
): Promise<void> {
  console.log(`  Inserting ${bookings.length} bookings…`)
  let inserted = 0; let skipped = 0

  for (const b of bookings) {
    const memberId  = memberMap.get(b.contactId)
    const sessionId = sessionMap.get(b.eventId)
    if (!memberId || !sessionId) { skipped++; continue }

    const { error } = await supabase
      .from('bookings')
      .upsert({ member_id: memberId, session_id: sessionId, status: b.status }, { onConflict: 'member_id,session_id', ignoreDuplicates: true })

    if (error) { console.warn(`  ⚠ Booking ${b.id}:`, error.message); skipped++ }
    else inserted++
  }
  console.log(`  ✓ Bookings: ${inserted} inserted, ${skipped} skipped (no match)`)
}

async function insertMemberships(
  memberships: WixMembership[],
  memberMap:   Map<string, string>,
): Promise<void> {
  console.log(`  Inserting ${memberships.length} memberships…`)
  let inserted = 0; let skipped = 0

  for (const m of memberships) {
    const memberId = memberMap.get(m.contactId)
    if (!memberId) { skipped++; continue }

    const { error } = await supabase
      .from('memberships')
      .insert({
        member_id:  memberId,
        plan_id:    m.planId,
        plan_name:  m.planName,
        status:     m.status,
        start_date: m.startDate,
        end_date:   m.endDate,
      })

    if (error && !error.message.includes('duplicate')) {
      console.warn(`  ⚠ Membership ${m.id}:`, error.message); skipped++
    } else inserted++
  }
  console.log(`  ✓ Memberships: ${inserted} inserted, ${skipped} skipped (no member match)`)
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n══ BodyForme: Wix → Supabase migration ══\n')

  if (!WIX_API_KEY || !WIX_SITE_ID) {
    console.error('Missing WIX_API_KEY or WIX_SITE_ID in .env.local')
    process.exit(1)
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local')
    process.exit(1)
  }

  console.log('── Fetching from Wix ─────────────────────')
  const staffMap    = await fetchStaff()
  const services    = await fetchServices()
  const contacts    = await fetchContacts()
  const credentials = await fetchMemberCredentials()
  const sessions    = await fetchSessions()
  const bookings    = await fetchBookings(contacts)
  const memberships = await fetchMemberships()

  console.log(`\nWix data summary:`)
  console.log(`  Staff:       ${Object.keys(staffMap).length}`)
  console.log(`  Services:    ${services.length}`)
  console.log(`  Contacts:    ${contacts.length}`)
  console.log(`  Credentials: ${credentials.length}`)
  console.log(`  Sessions:    ${sessions.length}`)
  console.log(`  Bookings:    ${bookings.length}`)
  console.log(`  Memberships: ${memberships.length}`)

  console.log('\n── Inserting into Supabase ───────────────')
  const serviceMap = await insertServices(services)
  const memberMap  = await insertMembers(contacts, credentials)
  const sessionMap = await insertSessions(sessions, serviceMap, staffMap)
  await insertBookings(bookings, memberMap, sessionMap)
  await insertMemberships(memberships, memberMap)

  console.log('\n══ Migration complete ══\n')
  console.log(`Note: Members imported from Wix Contacts (without a MemberCredentials entry)`)
  console.log(`have a locked password. They'll need "Forgot password" to log in.`)
}

main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
