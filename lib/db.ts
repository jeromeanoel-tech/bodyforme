import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

// ── Types (same shapes as before — drop-in compatible) ────────────────────────

export type WixStaff = {
  id: string
  name: string
  resourceId: string
}

export type WixService = {
  id: string
  name: string
  scheduleId: string
}

export type WixSession = {
  id: string
  title: string
  start: string
  end: string
  capacity: number
  bookedCount: number
  scheduleId: string
  staffResourceId: string
  status: string
}

export type WixMembership = {
  id: string
  contactId: string
  planId: string
  planName: string
  status: string
  startDate: string
  endDate: string
}

export type WixContact = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdDate: string
}

export type WixContactBooking = {
  id: string
  status: string
  title: string
  start: string
}

export type WixBooking = {
  id: string
  status: string
  contactDetails: { firstName: string; lastName: string; email: string }
}

export type MemberCredential = {
  _id:              string
  email:            string
  passwordHash:     string
  firstName:        string
  lastName:         string
  phone:            string
  suburb:           string
  status:           string
  wixContactId:     string
  stripeCustomerId: string
  planOverride:     string
  nextBillingDate:  string
  creditBalance:    number
  adminNotes:       string
}

export type MemberBooking = {
  bookingId: string
  sessionId: string
  status: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

function isoSlice(ts: string) {
  return new Date(ts).toISOString().slice(0, 19)
}

// eslint-disable-next-line
function rowToCredential(r: any): MemberCredential {
  return {
    _id:              r.id,
    email:            r.email,
    passwordHash:     r.password_hash,
    firstName:        r.first_name,
    lastName:         r.last_name,
    phone:            r.phone            ?? '',
    suburb:           r.suburb           ?? '',
    status:           r.status,
    wixContactId:     '',
    stripeCustomerId: r.stripe_customer_id ?? '',
    planOverride:     r.plan_override    ?? '',
    nextBillingDate:  r.next_billing_date ?? '',
    creditBalance:    Number(r.credit_balance ?? 0),
    adminNotes:       r.admin_notes      ?? '',
  }
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function getStaff(): Promise<WixStaff[]> {
  const { data } = await supabase
    .from('sessions')
    .select('instructor_name')
    .neq('instructor_name', '')
    .order('instructor_name')

  const names = [...new Set((data ?? []).map((r: { instructor_name: string }) => r.instructor_name))]
  return names.map(name => ({ id: slug(name), name, resourceId: slug(name) }))
}

// ── Services ──────────────────────────────────────────────────────────────────

export async function getServices(): Promise<WixService[]> {
  const { data } = await supabase.from('services').select('id, name').order('name')
  return (data ?? []).map((r: { id: string; name: string }) => ({
    id:         r.id,
    name:       r.name,
    scheduleId: r.id,
  }))
}

export async function createService(data: {
  name: string
  description?: string
  duration?: number
  capacity?: number
}): Promise<string> {
  const { data: row, error } = await supabase
    .from('services')
    .insert({ name: data.name, description: data.description ?? '', duration: data.duration ?? 60, capacity: data.capacity ?? 10 })
    .select('id')
    .single()
  if (error) throw error
  return row.id
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getSessions(from: string, to: string): Promise<WixSession[]> {
  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .gte('start_time', from)
    .lte('start_time', to.slice(0, 10) + 'T23:59:59')
    .order('start_time')

  if (!sessions?.length) return []

  // Fetch confirmed booking counts for these sessions
  const ids = sessions.map((s: { id: string }) => s.id)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('session_id')
    .in('session_id', ids)
    .eq('status', 'CONFIRMED')

  const countMap: Record<string, number> = {}
  ;(bookings ?? []).forEach((b: { session_id: string }) => {
    countMap[b.session_id] = (countMap[b.session_id] ?? 0) + 1
  })

  // eslint-disable-next-line
  return sessions.map((s: any) => ({
    id:              s.id,
    title:           s.title,
    start:           isoSlice(s.start_time),
    end:             isoSlice(s.end_time),
    capacity:        s.capacity,
    bookedCount:     countMap[s.id] ?? 0,
    scheduleId:      s.service_id ?? '',
    staffResourceId: slug(s.instructor_name ?? ''),
    status:          s.status,
  }))
}

export async function createSession(data: {
  serviceId: string
  title: string
  instructorName: string
  startTime: string
  endTime: string
  capacity: number
}): Promise<string> {
  const { data: row, error } = await supabase
    .from('sessions')
    .insert({ service_id: data.serviceId, title: data.title, instructor_name: data.instructorName, start_time: data.startTime, end_time: data.endTime, capacity: data.capacity })
    .select('id')
    .single()
  if (error) throw error
  return row.id
}

// ── Memberships ───────────────────────────────────────────────────────────────

export async function getMemberships(): Promise<WixMembership[]> {
  const { data } = await supabase
    .from('memberships')
    .select('*')
    .order('created_at', { ascending: false })

  // eslint-disable-next-line
  return (data ?? []).map((r: any) => ({
    id:        r.id,
    contactId: r.member_id,
    planId:    r.plan_id,
    planName:  r.plan_name,
    status:    r.status,
    startDate: r.start_date,
    endDate:   r.end_date,
  }))
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export async function getContacts(): Promise<WixContact[]> {
  const { data } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, phone, created_at')
    .order('last_name')
    .order('first_name')

  // eslint-disable-next-line
  return (data ?? []).map((r: any) => ({
    id:          r.id,
    firstName:   r.first_name,
    lastName:    r.last_name,
    email:       r.email,
    phone:       r.phone ?? '',
    createdDate: r.created_at,
  }))
}

// ── Member credentials ────────────────────────────────────────────────────────

export async function createMemberCredential(data: Omit<MemberCredential, '_id'>): Promise<string> {
  const { data: row, error } = await supabase
    .from('members')
    .insert({
      email:             data.email,
      password_hash:     data.passwordHash,
      first_name:        data.firstName,
      last_name:         data.lastName,
      phone:             data.phone ?? '',
      suburb:            data.suburb ?? '',
      status:            data.status,
      stripe_customer_id: data.stripeCustomerId,
      plan_override:     data.planOverride,
      next_billing_date: data.nextBillingDate,
      credit_balance:    data.creditBalance,
      admin_notes:       data.adminNotes,
    })
    .select('id')
    .single()
  if (error) throw error
  return row.id
}

export async function getMemberByEmail(email: string): Promise<MemberCredential | null> {
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('email', email)
    .single()
  return data ? rowToCredential(data) : null
}

export async function getMemberByContactId(id: string): Promise<MemberCredential | null> {
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('id', id)
    .single()
  return data ? rowToCredential(data) : null
}

export async function updateMemberCredential(id: string, patch: Partial<MemberCredential>): Promise<void> {
  const update: Record<string, unknown> = {}
  if (patch.email            !== undefined) update.email              = patch.email
  if (patch.passwordHash     !== undefined) update.password_hash     = patch.passwordHash
  if (patch.firstName        !== undefined) update.first_name        = patch.firstName
  if (patch.lastName         !== undefined) update.last_name         = patch.lastName
  if (patch.phone            !== undefined) update.phone             = patch.phone
  if (patch.suburb           !== undefined) update.suburb            = patch.suburb
  if (patch.status           !== undefined) update.status            = patch.status
  if (patch.stripeCustomerId !== undefined) update.stripe_customer_id = patch.stripeCustomerId
  if (patch.planOverride     !== undefined) update.plan_override     = patch.planOverride
  if (patch.nextBillingDate  !== undefined) update.next_billing_date = patch.nextBillingDate
  if (patch.creditBalance    !== undefined) update.credit_balance    = patch.creditBalance
  if (patch.adminNotes       !== undefined) update.admin_notes       = patch.adminNotes

  if (!Object.keys(update).length) return
  await supabase.from('members').update(update).eq('id', id)
}

// ── Bookings for a member ─────────────────────────────────────────────────────

export async function getContactBookings(memberId: string): Promise<WixContactBooking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('id, status, sessions(title, start_time)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(50)

  // eslint-disable-next-line
  return (data ?? []).map((r: any) => ({
    id:     r.id,
    status: r.status,
    title:  r.sessions?.title ?? '',
    start:  r.sessions?.start_time ? isoSlice(r.sessions.start_time) : '',
  }))
}

// ── Bookings for a session ────────────────────────────────────────────────────

export async function getSessionBookings(sessionId: string): Promise<WixBooking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('id, status, members(first_name, last_name, email)')
    .eq('session_id', sessionId)

  // eslint-disable-next-line
  return (data ?? []).map((r: any) => ({
    id:     r.id,
    status: r.status,
    contactDetails: {
      firstName: r.members?.first_name ?? '',
      lastName:  r.members?.last_name  ?? '',
      email:     r.members?.email      ?? '',
    },
  }))
}

// ── Mark attendance ───────────────────────────────────────────────────────────

export async function markAttendance(bookingId: string, attended: boolean): Promise<void> {
  await supabase.from('bookings').update({ attended }).eq('id', bookingId)
}

// ── Create / cancel booking ───────────────────────────────────────────────────

export async function createBooking(memberId: string, sessionId: string): Promise<string> {
  const { data, error } = await supabase
    .from('bookings')
    .upsert({ member_id: memberId, session_id: sessionId, status: 'CONFIRMED' }, { onConflict: 'member_id,session_id' })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

export async function cancelBooking(bookingId: string, memberId: string): Promise<void> {
  await supabase
    .from('bookings')
    .update({ status: 'CANCELLED' })
    .eq('id', bookingId)
    .eq('member_id', memberId)
}

// ── Member bookings for a date range ─────────────────────────────────────────

export async function getMemberBookingsForRange(
  memberId: string,
  from: string,
  to: string,
): Promise<MemberBooking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('id, session_id, status, sessions!inner(start_time)')
    .eq('member_id', memberId)
    .gte('sessions.start_time', from)
    .lte('sessions.start_time', to + 'T23:59:59')

  // eslint-disable-next-line
  return (data ?? []).map((r: any) => ({
    bookingId: r.id,
    sessionId: r.session_id,
    status:    r.status,
  }))
}

// ── Schema (run once via /api/migrate) ───────────────────────────────────────
// If the API route doesn't work, paste this into Supabase SQL Editor instead.

export async function runMigrations(): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS members (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email              TEXT UNIQUE NOT NULL,
      password_hash      TEXT NOT NULL,
      first_name         TEXT NOT NULL DEFAULT '',
      last_name          TEXT NOT NULL DEFAULT '',
      phone              TEXT NOT NULL DEFAULT '',
      suburb             TEXT NOT NULL DEFAULT '',
      status             TEXT NOT NULL DEFAULT 'active',
      stripe_customer_id TEXT NOT NULL DEFAULT '',
      plan_override      TEXT NOT NULL DEFAULT '',
      next_billing_date  TEXT NOT NULL DEFAULT '',
      credit_balance     INT  NOT NULL DEFAULT 0,
      admin_notes        TEXT NOT NULL DEFAULT '',
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS services (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      duration    INT  NOT NULL DEFAULT 60,
      capacity    INT  NOT NULL DEFAULT 10,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS sessions (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
      title           TEXT NOT NULL,
      instructor_name TEXT NOT NULL DEFAULT '',
      start_time      TIMESTAMPTZ NOT NULL,
      end_time        TIMESTAMPTZ NOT NULL,
      capacity        INT  NOT NULL DEFAULT 10,
      status          TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS bookings (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id  UUID REFERENCES members(id) ON DELETE CASCADE,
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      status     TEXT    NOT NULL DEFAULT 'CONFIRMED',
      attended   BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(member_id, session_id)
    )`,
    `CREATE TABLE IF NOT EXISTS memberships (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id  UUID REFERENCES members(id) ON DELETE CASCADE,
      plan_id    TEXT NOT NULL DEFAULT '',
      plan_name  TEXT NOT NULL DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'ACTIVE',
      start_date TEXT NOT NULL DEFAULT '',
      end_date   TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  ]

  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql })
    if (error) throw new Error(error.message)
  }
}
