const SITE_ID = process.env.WIX_SITE_ID!
const API_KEY = process.env.WIX_API_KEY!
const BASE    = 'https://www.wixapis.com'

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: API_KEY,
    'wix-site-id': SITE_ID,
  }
}

async function wixFetch(path: string, body?: object, ttl = 30) {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
    next: { revalidate: ttl },
  })
  if (!res.ok) throw new Error(`Wix API ${path} → ${res.status}`)
  return res.json()
}

// ── Staff ─────────────────────────────────────────────────────────────────────

export type WixStaff = {
  id: string
  name: string
  resourceId: string
}

export async function getStaff(): Promise<WixStaff[]> {
  const data = await wixFetch('/bookings/v1/staff-members/query', {
    query: { paging: { limit: 100 } },
  }, 300)
  return (data.staffMembers ?? []).map((s: Record<string, unknown>) => ({
    id:         s.id as string,
    name:       s.name as string,
    resourceId: s.resourceId as string,
  }))
}

// ── Services ──────────────────────────────────────────────────────────────────

export type WixService = {
  id: string
  name: string
  scheduleId: string
}

export async function getServices(): Promise<WixService[]> {
  const data = await wixFetch('/bookings/v2/services/query', {
    query: { paging: { limit: 100 } },
  }, 300)
  return (data.services ?? []).map((s: Record<string, unknown>) => ({
    id:         s.id as string,
    name:       s.name as string,
    scheduleId: (s.schedule as Record<string, string>)?.id ?? '',
  }))
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export type WixSession = {
  id: string
  title: string
  start: string   // "2026-04-27T09:30:00"
  end: string
  capacity: number
  bookedCount: number
  scheduleId: string
  staffResourceId: string
  status: string  // "CONFIRMED" | "CANCELLED" etc
}

export async function getSessions(from: string, to: string): Promise<WixSession[]> {
  const data = await wixFetch('/calendar/v3/events/query', {
    fromLocalDate: from,
    toLocalDate:   to,
    query: { paging: { limit: 200 } },
  })
  return (data.events ?? []).map((e: Record<string, unknown>) => {
    const start       = (e.start as Record<string, string>)?.localDate ?? ''
    const end         = (e.end   as Record<string, string>)?.localDate ?? ''
    const resources   = (e.resources as Array<Record<string, string>>) ?? []
    const bookedCount = (e.participation as Record<string, number>)?.numberOfParticipants ?? 0
    return {
      id:              e.id as string,
      title:           (e.title as string) ?? '',
      start,
      end,
      capacity:        (e.capacity as number) ?? 0,
      bookedCount,
      scheduleId:      (e.scheduleId as string) ?? '',
      staffResourceId: resources[0]?.id ?? '',
      status:          (e.status as string) ?? 'CONFIRMED',
    }
  })
}

// ── Memberships (Pricing Plan orders) ────────────────────────────────────────

export type WixMembership = {
  id: string
  contactId: string
  planId: string
  planName: string
  status: string   // ACTIVE | PAUSED | ENDED | CANCELED | PENDING | DRAFT
  startDate: string
  endDate: string
}

export async function getMemberships(): Promise<WixMembership[]> {
  try {
    const data = await wixFetch('/pricing-plans/v2/orders/query', {
      query: { paging: { limit: 500 } },
    }, 60)
    return (data.orders ?? []).map((o: Record<string, unknown>) => {
      const buyer = (o.buyer as Record<string, string>) ?? {}
      return {
        id:        o.id as string,
        contactId: buyer.contactId ?? '',
        planId:    (o.planId    as string) ?? '',
        planName:  (o.planName  as string) ?? '',
        status:    (o.status    as string) ?? '',
        startDate: (o.startDate as string) ?? '',
        endDate:   (o.endDate   as string) ?? '',
      }
    })
  } catch {
    return []
  }
}

// ── Contacts ──────────────────────────────────────────────────────────────────

export type WixContact = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  createdDate: string
}

export async function getContacts(): Promise<WixContact[]> {
  const data = await wixFetch('/contacts/v4/contacts/query', {
    query: {
      sort: [{ fieldName: 'info.name.last', order: 'ASC' }],
      paging: { limit: 200 },
    },
  }, 60)
  return (data.contacts ?? []).map((c: Record<string, unknown>) => {
    const info        = (c.info as Record<string, unknown>) ?? {}
    const name        = (info.name as Record<string, string>) ?? {}
    const primaryInfo = (c.primaryInfo as Record<string, string>) ?? {}
    return {
      id:          c.id as string,
      firstName:   name.first  ?? '',
      lastName:    name.last   ?? '',
      email:       primaryInfo.email ?? '',
      phone:       primaryInfo.phone ?? '',
      createdDate: (c.createdDate as string) ?? '',
    }
  })
}

export type WixContactBooking = {
  id: string
  status: string
  title: string
  start: string
}

export async function getContactBookings(contactId: string): Promise<WixContactBooking[]> {
  const data = await wixFetch('/bookings/v2/bookings/query', {
    query: {
      filter: { contactId },
      sort: [{ fieldName: 'createdDate', order: 'DESC' }],
      paging: { limit: 20 },
    },
  }, 0)
  return (data.bookings ?? []).map((b: Record<string, unknown>) => {
    const entity   = (b.bookedEntity as Record<string, unknown>) ?? {}
    const event    = (entity.event as Record<string, unknown>) ?? {}
    const slot     = (entity.slot  as Record<string, unknown>) ?? {}
    const title    = (event.title  as string) ?? (slot.title as string) ?? 'Class'
    const startObj = ((event.start ?? slot.start) as Record<string, string>) ?? {}
    return {
      id:     b.id as string,
      status: (b.status as string) ?? 'CONFIRMED',
      title,
      start:  startObj.localDate ?? '',
    }
  })
}

// ── Mark attendance ───────────────────────────────────────────────────────────

export async function markAttendance(bookingId: string, attended: boolean): Promise<void> {
  await fetch(`${BASE}/bookings/v1/attendance`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      attendance: {
        bookingId,
        attendanceStatus: attended ? 'ATTENDED' : 'NOT_ATTENDED',
        numberOfAttendees: attended ? 1 : 0,
      },
    }),
  })
}

// ── Bookings for a session ────────────────────────────────────────────────────

export type WixBooking = {
  id: string
  status: string
  contactDetails: { firstName: string; lastName: string; email: string }
}

export async function getSessionBookings(eventId: string): Promise<WixBooking[]> {
  const data = await wixFetch('/bookings/v2/bookings/query', {
    query: {
      filter: { 'bookedEntity.event.eventId': eventId },
      paging: { limit: 100 },
    },
  }, 0)
  return (data.bookings ?? []).map((b: Record<string, unknown>) => {
    const c = (b.contactDetails as Record<string, string>) ?? {}
    return {
      id:             b.id as string,
      status:         b.status as string,
      contactDetails: {
        firstName: c.firstName ?? '',
        lastName:  c.lastName  ?? '',
        email:     c.email     ?? '',
      },
    }
  })
}
