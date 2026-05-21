import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// Raw parameterised helper for the one dynamic UPDATE — neon supports this
// call form at runtime but TS types only expose the tagged-template overload.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawSql = (query: string, params: (string | number | boolean | null)[]) =>
  (sql as any)(query, params) as Promise<Record<string, unknown>[]>

// ── Schema ────────────────────────────────────────────────────────────────────

export async function runMigrations(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS members (
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
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS services (
      id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name        TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      duration    INT  NOT NULL DEFAULT 60,
      capacity    INT  NOT NULL DEFAULT 10,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
      title           TEXT NOT NULL,
      instructor_name TEXT NOT NULL DEFAULT '',
      start_time      TIMESTAMPTZ NOT NULL,
      end_time        TIMESTAMPTZ NOT NULL,
      capacity        INT  NOT NULL DEFAULT 10,
      status          TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS bookings (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id  UUID REFERENCES members(id) ON DELETE CASCADE,
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      status     TEXT    NOT NULL DEFAULT 'CONFIRMED',
      attended   BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(member_id, session_id)
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS memberships (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      member_id  UUID REFERENCES members(id) ON DELETE CASCADE,
      plan_id    TEXT NOT NULL DEFAULT '',
      plan_name  TEXT NOT NULL DEFAULT '',
      status     TEXT NOT NULL DEFAULT 'ACTIVE',
      start_date TEXT NOT NULL DEFAULT '',
      end_date   TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

// ── Types (same shapes as lib/wix.ts for drop-in compatibility) ───────────────

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
  wixContactId:     string  // always '' in new system
  stripeCustomerId: string
  planOverride:     string
  nextBillingDate:  string
  creditBalance:    number
  adminNotes:       string
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export async function getStaff(): Promise<WixStaff[]> {
  const rows = await sql`
    SELECT DISTINCT instructor_name
    FROM sessions
    WHERE instructor_name != ''
    ORDER BY instructor_name
  `
  return rows.map(r => {
    const slug = (r.instructor_name as string).toLowerCase().replace(/\s+/g, '-')
    return { id: slug, name: r.instructor_name as string, resourceId: slug }
  })
}

// ── Services ──────────────────────────────────────────────────────────────────

export async function getServices(): Promise<WixService[]> {
  const rows = await sql`SELECT id, name FROM services ORDER BY name`
  return rows.map(r => ({
    id:         r.id as string,
    name:       r.name as string,
    scheduleId: r.id as string,  // serviceId IS scheduleId in this system
  }))
}

export async function createService(data: {
  name: string
  description?: string
  duration?: number
  capacity?: number
}): Promise<string> {
  const rows = await sql`
    INSERT INTO services (name, description, duration, capacity)
    VALUES (${data.name}, ${data.description ?? ''}, ${data.duration ?? 60}, ${data.capacity ?? 10})
    RETURNING id
  `
  return rows[0].id as string
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getSessions(from: string, to: string): Promise<WixSession[]> {
  const rows = await sql`
    SELECT
      s.id,
      s.title,
      s.start_time,
      s.end_time,
      s.capacity,
      s.service_id,
      s.instructor_name,
      s.status,
      COUNT(b.id) FILTER (WHERE b.status = 'CONFIRMED') AS booked_count
    FROM sessions s
    LEFT JOIN bookings b ON b.session_id = s.id
    WHERE s.start_time >= ${from}::date
      AND s.start_time <  (${to}::date + INTERVAL '1 day')
    GROUP BY s.id
    ORDER BY s.start_time
  `
  return rows.map(r => {
    const slug = (r.instructor_name as string).toLowerCase().replace(/\s+/g, '-')
    return {
      id:              r.id as string,
      title:           r.title as string,
      start:           (r.start_time as Date).toISOString().slice(0, 19),
      end:             (r.end_time   as Date).toISOString().slice(0, 19),
      capacity:        Number(r.capacity),
      bookedCount:     Number(r.booked_count ?? 0),
      scheduleId:      (r.service_id as string) ?? '',
      staffResourceId: slug,
      status:          r.status as string,
    }
  })
}

export async function createSession(data: {
  serviceId: string
  title: string
  instructorName: string
  startTime: string
  endTime: string
  capacity: number
}): Promise<string> {
  const rows = await sql`
    INSERT INTO sessions (service_id, title, instructor_name, start_time, end_time, capacity)
    VALUES (${data.serviceId}, ${data.title}, ${data.instructorName}, ${data.startTime}, ${data.endTime}, ${data.capacity})
    RETURNING id
  `
  return rows[0].id as string
}

// ── Memberships ───────────────────────────────────────────────────────────────

export async function getMemberships(): Promise<WixMembership[]> {
  const rows = await sql`
    SELECT id, member_id, plan_id, plan_name, status, start_date, end_date
    FROM memberships
    ORDER BY created_at DESC
  `
  return rows.map(r => ({
    id:        r.id as string,
    contactId: r.member_id as string,
    planId:    r.plan_id as string,
    planName:  r.plan_name as string,
    status:    r.status as string,
    startDate: r.start_date as string,
    endDate:   r.end_date as string,
  }))
}

// ── Contacts (members list for admin) ─────────────────────────────────────────

export async function getContacts(): Promise<WixContact[]> {
  const rows = await sql`
    SELECT id, first_name, last_name, email, phone, created_at
    FROM members
    ORDER BY last_name ASC, first_name ASC
  `
  return rows.map(r => ({
    id:          r.id as string,
    firstName:   r.first_name as string,
    lastName:    r.last_name as string,
    email:       r.email as string,
    phone:       r.phone as string,
    createdDate: (r.created_at as Date).toISOString(),
  }))
}

// ── Member credentials ────────────────────────────────────────────────────────

function rowToCredential(r: Record<string, unknown>): MemberCredential {
  return {
    _id:              r.id as string,
    email:            r.email as string,
    passwordHash:     r.password_hash as string,
    firstName:        r.first_name as string,
    lastName:         r.last_name as string,
    phone:            (r.phone as string) ?? '',
    suburb:           (r.suburb as string) ?? '',
    status:           r.status as string,
    wixContactId:     '',
    stripeCustomerId: (r.stripe_customer_id as string) ?? '',
    planOverride:     (r.plan_override as string) ?? '',
    nextBillingDate:  (r.next_billing_date as string) ?? '',
    creditBalance:    Number(r.credit_balance ?? 0),
    adminNotes:       (r.admin_notes as string) ?? '',
  }
}

export async function createMemberCredential(data: Omit<MemberCredential, '_id'>): Promise<string> {
  const rows = await sql`
    INSERT INTO members (
      email, password_hash, first_name, last_name, phone, suburb,
      status, stripe_customer_id, plan_override, next_billing_date, credit_balance, admin_notes
    ) VALUES (
      ${data.email},
      ${data.passwordHash},
      ${data.firstName},
      ${data.lastName},
      ${data.phone ?? ''},
      ${data.suburb ?? ''},
      ${data.status},
      ${data.stripeCustomerId},
      ${data.planOverride},
      ${data.nextBillingDate},
      ${data.creditBalance},
      ${data.adminNotes}
    )
    RETURNING id
  `
  return rows[0].id as string
}

export async function getMemberByEmail(email: string): Promise<MemberCredential | null> {
  const rows = await sql`SELECT * FROM members WHERE email = ${email} LIMIT 1`
  if (!rows.length) return null
  return rowToCredential(rows[0] as Record<string, unknown>)
}

export async function getMemberByContactId(id: string): Promise<MemberCredential | null> {
  // contactId IS the member UUID in this system
  const rows = await sql`SELECT * FROM members WHERE id = ${id} LIMIT 1`
  if (!rows.length) return null
  return rowToCredential(rows[0] as Record<string, unknown>)
}

export async function updateMemberCredential(id: string, patch: Partial<MemberCredential>): Promise<void> {
  const fields: string[] = []
  const values: (string | number | boolean | null)[] = []
  let i = 1

  if (patch.email            !== undefined) { fields.push(`email = $${i++}`);              values.push(patch.email) }
  if (patch.passwordHash     !== undefined) { fields.push(`password_hash = $${i++}`);      values.push(patch.passwordHash) }
  if (patch.firstName        !== undefined) { fields.push(`first_name = $${i++}`);         values.push(patch.firstName) }
  if (patch.lastName         !== undefined) { fields.push(`last_name = $${i++}`);          values.push(patch.lastName) }
  if (patch.phone            !== undefined) { fields.push(`phone = $${i++}`);              values.push(patch.phone) }
  if (patch.suburb           !== undefined) { fields.push(`suburb = $${i++}`);             values.push(patch.suburb) }
  if (patch.status           !== undefined) { fields.push(`status = $${i++}`);             values.push(patch.status) }
  if (patch.stripeCustomerId !== undefined) { fields.push(`stripe_customer_id = $${i++}`); values.push(patch.stripeCustomerId) }
  if (patch.planOverride     !== undefined) { fields.push(`plan_override = $${i++}`);      values.push(patch.planOverride) }
  if (patch.nextBillingDate  !== undefined) { fields.push(`next_billing_date = $${i++}`);  values.push(patch.nextBillingDate) }
  if (patch.creditBalance    !== undefined) { fields.push(`credit_balance = $${i++}`);     values.push(patch.creditBalance) }
  if (patch.adminNotes       !== undefined) { fields.push(`admin_notes = $${i++}`);        values.push(patch.adminNotes) }

  if (!fields.length) return
  values.push(id)

  await rawSql(`UPDATE members SET ${fields.join(', ')} WHERE id = $${i}`, values)
}

// ── Bookings for a member ─────────────────────────────────────────────────────

export async function getContactBookings(memberId: string): Promise<WixContactBooking[]> {
  const rows = await sql`
    SELECT b.id, b.status, s.title, s.start_time
    FROM bookings b
    JOIN sessions s ON s.id = b.session_id
    WHERE b.member_id = ${memberId}
    ORDER BY s.start_time DESC
    LIMIT 50
  `
  return rows.map(r => ({
    id:     r.id as string,
    status: r.status as string,
    title:  r.title as string,
    start:  (r.start_time as Date).toISOString().slice(0, 19),
  }))
}

// ── Bookings for a session ────────────────────────────────────────────────────

export async function getSessionBookings(sessionId: string): Promise<WixBooking[]> {
  const rows = await sql`
    SELECT b.id, b.status, m.first_name, m.last_name, m.email
    FROM bookings b
    JOIN members m ON m.id = b.member_id
    WHERE b.session_id = ${sessionId}
    ORDER BY m.last_name, m.first_name
  `
  return rows.map(r => ({
    id:     r.id as string,
    status: r.status as string,
    contactDetails: {
      firstName: r.first_name as string,
      lastName:  r.last_name as string,
      email:     r.email as string,
    },
  }))
}

// ── Mark attendance ───────────────────────────────────────────────────────────

export async function markAttendance(bookingId: string, attended: boolean): Promise<void> {
  await sql`UPDATE bookings SET attended = ${attended} WHERE id = ${bookingId}`
}

// ── Create / cancel booking ───────────────────────────────────────────────────

export async function createBooking(memberId: string, sessionId: string): Promise<string> {
  const rows = await sql`
    INSERT INTO bookings (member_id, session_id)
    VALUES (${memberId}, ${sessionId})
    ON CONFLICT (member_id, session_id) DO UPDATE SET status = 'CONFIRMED'
    RETURNING id
  `
  return rows[0].id as string
}

export async function cancelBooking(bookingId: string, memberId: string): Promise<void> {
  await sql`
    UPDATE bookings SET status = 'CANCELLED'
    WHERE id = ${bookingId} AND member_id = ${memberId}
  `
}
