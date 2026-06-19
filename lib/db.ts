import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

// ── Types ─────────────────────────────────────────────────────────────────────

export type Staff = {
  id: string
  name: string
  resourceId: string
}

export type Service = {
  id: string
  name: string
  scheduleId: string
}

export type Session = {
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

export type Membership = {
  id: string
  contactId: string
  planId: string
  planName: string
  status: string
  startDate: string
  endDate: string
}

export type Contact = {
  id:              string
  firstName:       string
  lastName:        string
  email:           string
  phone:           string
  createdDate:     string
  planOverride?:   string
  memberStatus?:   string
  endDate?:        string
  nextBillingDate?: string
}

export type ContactBooking = {
  id: string
  status: string
  title: string
  start: string
  attended: boolean
}

export type Booking = {
  id: string
  status: string
  attended: boolean
  contactDetails: { firstName: string; lastName: string; email: string }
  memberId: string
  planOverride: string
  creditBalance: number
  memberStatus: string
  classesRemaining: number | null  // null = unlimited
}

export type MemberCredential = {
  _id:                string
  email:              string
  passwordHash:       string
  firstName:          string
  lastName:           string
  phone:              string
  suburb:             string
  status:             string
  stripeCustomerId:   string
  planOverride:       string
  nextBillingDate:    string
  membershipEndDate?: string  // ISO date; for prepaid plans (3/6/12 month)
  creditBalance:      number
  adminNotes:         string
  paidTerm:           string  // '1 month' | '3 months' | '6 months' | '12 months' | ''
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
    _id:               r.id,
    email:             r.email,
    passwordHash:      r.password_hash,
    firstName:         r.first_name,
    lastName:          r.last_name,
    phone:             r.phone             ?? '',
    suburb:            r.suburb            ?? '',
    status:            r.status,
    stripeCustomerId:  r.stripe_customer_id ?? '',
    planOverride:      r.plan_override      ?? '',
    nextBillingDate:   r.next_billing_date  ?? '',
    membershipEndDate: r.end_date           ?? '',
    creditBalance:     Number(r.credit_balance ?? 0),
    adminNotes:        r.admin_notes        ?? '',
    paidTerm:          r.paid_term          ?? '',
  }
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function getStaff(): Promise<Staff[]> {
  const { data } = await supabase
    .from('sessions')
    .select('instructor_name')
    .neq('instructor_name', '')
    .order('instructor_name')

  const names = [...new Set((data ?? []).map((r: { instructor_name: string }) => r.instructor_name))]
  return names.map(name => ({ id: slug(name), name, resourceId: slug(name) }))
}

// ── Services ──────────────────────────────────────────────────────────────────

export async function getServices(): Promise<Service[]> {
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
    .insert({ name: data.name, description: data.description ?? '', duration: data.duration ?? 60, capacity: data.capacity ?? 25 })
    .select('id')
    .single()
  if (error) throw error
  return row.id
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getSessions(from: string, to: string): Promise<Session[]> {
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

export async function upsertMembership(data: {
  memberId: string
  planName: string
  status: string
  startDate: string
  endDate: string
}): Promise<void> {
  await supabase
    .from('memberships')
    .upsert(
      {
        member_id:  data.memberId,
        plan_name:  data.planName,
        status:     data.status,
        start_date: data.startDate,
        end_date:   data.endDate,
      },
      { onConflict: 'member_id' },
    )
}

export async function getMemberships(): Promise<Membership[]> {
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

export async function getContacts(): Promise<Contact[]> {
  const { data } = await supabase
    .from('members')
    .select('id, first_name, last_name, email, phone, created_at, plan_override, status, end_date, next_billing_date')
    .order('last_name')
    .order('first_name')

  // eslint-disable-next-line
  return (data ?? []).map((r: any) => ({
    id:              r.id,
    firstName:       r.first_name,
    lastName:        r.last_name,
    email:           r.email,
    phone:           r.phone ?? '',
    createdDate:     r.created_at,
    planOverride:    r.plan_override ?? undefined,
    memberStatus:    r.status ?? undefined,
    endDate:         r.end_date ?? undefined,
    nextBillingDate: r.next_billing_date ?? undefined,
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

export async function getMemberByStripeCustomerId(customerId: string): Promise<MemberCredential | null> {
  const { data } = await supabase
    .from('members')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single()
  return data ? rowToCredential(data) : null
}

export const getMemberById = async (id: string) => getMemberByContactId(id)

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
  if (patch.planOverride      !== undefined) update.plan_override      = patch.planOverride
  if (patch.nextBillingDate   !== undefined) update.next_billing_date  = patch.nextBillingDate
  if (patch.membershipEndDate !== undefined) update.end_date           = patch.membershipEndDate
  if (patch.creditBalance     !== undefined) update.credit_balance     = patch.creditBalance
  if (patch.adminNotes        !== undefined) update.admin_notes        = patch.adminNotes
  if (patch.paidTerm          !== undefined) update.paid_term          = patch.paidTerm

  if (!Object.keys(update).length) return
  await supabase.from('members').update(update).eq('id', id)
}

// ── Bookings for a member ─────────────────────────────────────────────────────

export async function getContactBookings(memberId: string): Promise<ContactBooking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('id, status, attended, sessions(title, start_time)')
    .eq('member_id', memberId)
    .order('created_at', { ascending: false })
    .limit(50)

  // eslint-disable-next-line
  return (data ?? []).map((r: any) => ({
    id:       r.id,
    status:   r.status,
    attended: r.attended ?? false,
    title:    r.sessions?.title ?? '',
    start:    r.sessions?.start_time ? isoSlice(r.sessions.start_time) : '',
  }))
}

// ── Bookings for a session ────────────────────────────────────────────────────

// Plans with a weekly class allowance — key fragment matched case-insensitively
const WEEKLY_PLAN_ALLOWANCE: Record<string, number> = {
  '3 per week': 3,
  'weekly-3':   3,
  '4 per week': 4,
  'weekly-4':   4,
}
const UNLIMITED_KEYWORDS = ['unlimited', 'weekly-unlimited']

function weekBounds() {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const mon = new Date(now)
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  return { weekStart: mon.toISOString(), weekEnd: sun.toISOString() }
}

function weeklyAllowance(plan: string): number | null {
  const p = plan.toLowerCase()
  if (UNLIMITED_KEYWORDS.some(k => p.includes(k))) return null   // unlimited
  for (const [key, limit] of Object.entries(WEEKLY_PLAN_ALLOWANCE)) {
    if (p.includes(key)) return limit
  }
  return undefined as unknown as number  // not a weekly plan
}

export async function getSessionBookings(sessionId: string): Promise<Booking[]> {
  const { data } = await supabase
    .from('bookings')
    .select('id, status, attended, members(id, first_name, last_name, email, plan_override, credit_balance, status)')
    .eq('session_id', sessionId)

  if (!data || data.length === 0) return []

  // For weekly-allowance members, count confirmed bookings this Mon–Sun
  const { weekStart, weekEnd } = weekBounds()

  // eslint-disable-next-line
  const weeklyMemberIds = (data as any[])
    .filter(r => {
      const plan = r.members?.plan_override ?? ''
      const a = weeklyAllowance(plan)
      return a !== undefined && a !== null  // has a weekly limit (not unlimited, not a pack)
    })
    .map(r => r.members?.id)
    .filter(Boolean)

  const usageMap: Record<string, number> = {}
  if (weeklyMemberIds.length > 0) {
    const { data: usageRows } = await supabase
      .from('bookings')
      .select('member_id, sessions!inner(start_time)')
      .in('member_id', weeklyMemberIds)
      .eq('status', 'CONFIRMED')
      .gte('sessions.start_time', weekStart)
      .lte('sessions.start_time', weekEnd)

    // eslint-disable-next-line
    ;(usageRows ?? []).forEach((r: any) => {
      usageMap[r.member_id] = (usageMap[r.member_id] ?? 0) + 1
    })
  }

  // eslint-disable-next-line
  return (data as any[]).map(r => {
    const plan    = r.members?.plan_override ?? ''
    const credits = Number(r.members?.credit_balance ?? 0)
    const wa      = weeklyAllowance(plan)
    let classesRemaining: number | null

    if (wa === null) {
      // Unlimited plan
      classesRemaining = null
    } else if (wa !== undefined) {
      // Weekly-allowance plan
      const used = usageMap[r.members?.id] ?? 0
      classesRemaining = Math.max(0, wa - used)
    } else {
      // Class pack — credit balance (decremented on each attendance)
      classesRemaining = credits
    }

    return {
      id:       r.id,
      status:   r.status,
      attended: !!r.attended,
      contactDetails: {
        firstName: r.members?.first_name ?? '',
        lastName:  r.members?.last_name  ?? '',
        email:     r.members?.email      ?? '',
      },
      memberId:         r.members?.id      ?? '',
      planOverride:     plan,
      creditBalance:    credits,
      memberStatus:     r.members?.status  ?? '',
      classesRemaining,
    }
  })
}

// ── Mark attendance ───────────────────────────────────────────────────────────

// Plans that consume a credit per class attended
export const CREDIT_PLANS = [
  'Casual Drop-in', 'casual', 'Casual Class',
  '5-Class Pack', '5 Class Pack',
  '10-Class Pack', '10 Class Pack',
  '20-Class Pack', '20 Class Pack',
  '50-Class Pass', '50 Class Pass',
  'Free Trial',
]

export async function markAttendance(bookingId: string, attended: boolean): Promise<void> {
  // Read current attended state BEFORE updating so we know whether a credit was previously deducted
  const { data: prev } = await supabase
    .from('bookings')
    .select('attended, member_id, members(plan_override, credit_balance)')
    .eq('id', bookingId)
    .single()

  // Mark the booking
  await supabase.from('bookings').update({ attended }).eq('id', bookingId)

  if (!prev) return
  // eslint-disable-next-line
  const member     = (prev as any).members
  const plan       = (member?.plan_override ?? '') as string
  const isPackPlan = CREDIT_PLANS.some(p => plan.toLowerCase().includes(p.toLowerCase()))

  if (!isPackPlan) return

  const wasAttended = !!prev.attended
  const current     = Number(member?.credit_balance ?? 0)

  let next = current
  if (attended && !wasAttended) {
    // Newly checked in — deduct one credit
    next = Math.max(0, current - 1)
  } else if (!attended && wasAttended) {
    // Un-checked (was previously attended) — restore the credit that was deducted
    next = current + 1
  }
  // If state didn't change, or both false, no credit adjustment needed

  if (next !== current) {
    await supabase
      .from('members')
      .update({ credit_balance: next })
      .eq('id', prev.member_id)
  }
}

// ── Credit reservation check ─────────────────────────────────────────────────

// Returns the number of upcoming CONFIRMED bookings not yet attended.
// Used to prevent a member from booking more classes than their credit balance.
export async function countPendingBookings(memberId: string): Promise<number> {
  const { count } = await supabase
    .from('bookings')
    .select('sessions!inner(start_time)', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .eq('status', 'CONFIRMED')
    .neq('attended', true)
    .gt('sessions.start_time', new Date().toISOString())
  return count ?? 0
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

// ── Session lookup ────────────────────────────────────────────────────────────

export async function getSessionById(id: string): Promise<{ title: string; start_time: string; instructor_name: string; status: string; capacity: number; bookedCount: number } | null> {
  const { data } = await supabase
    .from('sessions')
    .select('title, start_time, instructor_name, status, capacity')
    .eq('id', id)
    .single()
  if (!data) return null
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', id)
    .eq('status', 'CONFIRMED')
  // eslint-disable-next-line
  return { ...(data as any), bookedCount: count ?? 0 }
}

// ── Booking with session details (for cancel flow) ────────────────────────────

export async function getBookingWithSession(bookingId: string, memberId: string): Promise<{
  sessionId: string; title: string; start_time: string
} | null> {
  const { data } = await supabase
    .from('bookings')
    .select('session_id, sessions(title, start_time)')
    .eq('id', bookingId)
    .eq('member_id', memberId)
    .single()
  if (!data) return null
  // eslint-disable-next-line
  const s = (data as any).sessions
  return { sessionId: data.session_id, title: s?.title ?? '', start_time: s?.start_time ?? '' }
}

// ── Waitlist ──────────────────────────────────────────────────────────────────

export async function joinWaitlist(memberId: string, sessionId: string): Promise<void> {
  await supabase
    .from('waitlist')
    .upsert({ member_id: memberId, session_id: sessionId }, { onConflict: 'member_id,session_id' })
}

export async function leaveWaitlist(memberId: string, sessionId: string): Promise<void> {
  await supabase
    .from('waitlist')
    .delete()
    .eq('member_id', memberId)
    .eq('session_id', sessionId)
}

export async function getMemberWaitlistInRange(
  memberId: string,
  from: string,
  to: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('waitlist')
    .select('session_id, sessions!inner(start_time)')
    .eq('member_id', memberId)
    .gte('sessions.start_time', from)
    .lte('sessions.start_time', to + 'T23:59:59')
  return (data ?? []).map((r: { session_id: string }) => r.session_id)
}

export async function getFirstOnWaitlist(sessionId: string): Promise<{
  memberId: string; email: string; firstName: string
} | null> {
  const { data } = await supabase
    .from('waitlist')
    .select('member_id, members(email, first_name)')
    .eq('session_id', sessionId)
    .order('created_at')
    .limit(1)
    .single()
  if (!data) return null
  // eslint-disable-next-line
  const m = (data as any).members
  return { memberId: data.member_id, email: m?.email ?? '', firstName: m?.first_name ?? '' }
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

// ── Password reset tokens ─────────────────────────────────────────────────────

export async function createPasswordResetToken(memberId: string): Promise<string> {
  const token = crypto.randomUUID() + '-' + crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('password_reset_tokens')
    .insert({ member_id: memberId, token, expires_at: expiresAt })
  if (error) throw error
  return token
}

export async function getPasswordResetToken(token: string): Promise<{
  memberId: string; expiresAt: string; usedAt: string | null
} | null> {
  const { data } = await supabase
    .from('password_reset_tokens')
    .select('member_id, expires_at, used_at')
    .eq('token', token)
    .single()
  if (!data) return null
  return { memberId: data.member_id, expiresAt: data.expires_at, usedAt: data.used_at }
}

export async function markTokenUsed(token: string): Promise<void> {
  await supabase
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
}

export async function updateMemberPassword(memberId: string, passwordHash: string): Promise<void> {
  await supabase.from('members').update({ password_hash: passwordHash }).eq('id', memberId)
}

// ── Free trial stats ──────────────────────────────────────────────────────────

export async function getFreeTrialCount(): Promise<number> {
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('plan_override', 'Free Trial')
  return count ?? 0
}

// ── Admin password reset ──────────────────────────────────────────────────────

export async function createAdminPasswordResetToken(username: string): Promise<string> {
  const token = crypto.randomUUID() + '-' + crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const { error } = await supabase
    .from('admin_password_resets')
    .insert({ username, token, expires_at: expiresAt })
  if (error) throw error
  return token
}

export async function getAdminPasswordResetToken(token: string): Promise<{
  username: string; expiresAt: string; usedAt: string | null
} | null> {
  const { data } = await supabase
    .from('admin_password_resets')
    .select('username, expires_at, used_at')
    .eq('token', token)
    .single()
  if (!data) return null
  return { username: data.username, expiresAt: data.expires_at, usedAt: data.used_at }
}

export async function markAdminTokenUsed(token: string): Promise<void> {
  await supabase
    .from('admin_password_resets')
    .update({ used_at: new Date().toISOString() })
    .eq('token', token)
}

export async function setAdminPasswordOverride(username: string, passwordHash: string): Promise<void> {
  await supabase
    .from('admin_password_overrides')
    .upsert({ username, password_hash: passwordHash, updated_at: new Date().toISOString() })
}

export async function getAdminPasswordOverride(username: string): Promise<string | null> {
  const { data } = await supabase
    .from('admin_password_overrides')
    .select('password_hash')
    .eq('username', username)
    .single()
  return data?.password_hash ?? null
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
    `CREATE TABLE IF NOT EXISTS waitlist (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id  UUID REFERENCES members(id) ON DELETE CASCADE,
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(member_id, session_id)
    )`,
    `CREATE INDEX IF NOT EXISTS waitlist_session_created ON waitlist (session_id, created_at)`,
    `CREATE TABLE IF NOT EXISTS admin_password_resets (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username   TEXT NOT NULL,
      token      TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at    TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS admin_password_overrides (
      username      TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `ALTER TABLE members ADD COLUMN IF NOT EXISTS paid_term TEXT NOT NULL DEFAULT ''`,
  ]

  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_sql', { sql })
    if (error) throw new Error(error.message)
  }
}
