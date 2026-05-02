'use client'

import { useState } from 'react'
import type { WixSession, WixService, WixBooking } from '@/lib/wix'

type Props = {
  sessions: WixSession[]
  services: WixService[]
}

type AttendeeState = Record<string, 'present' | 'absent' | 'loading'>

function fmt12(iso: string) {
  if (!iso) return ''
  const [, time] = iso.split('T')
  const [h, m] = time.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const h12  = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0
}

export default function CheckInClient({ sessions, services }: Props) {
  const [selectedSession, setSelectedSession] = useState<WixSession | null>(
    sessions.length > 0 ? sessions[0] : null
  )
  const [bookings, setBookings]   = useState<WixBooking[] | null>(null)
  const [loading, setLoading]     = useState(false)
  const [search, setSearch]       = useState('')
  const [attended, setAttended]   = useState<AttendeeState>({})

  const scheduleToName = Object.fromEntries(services.map(s => [s.scheduleId, s.name]))

  function selectSession(s: WixSession) {
    setSelectedSession(s)
    setBookings(null)
    setAttended({})
    setSearch('')
    loadBookings(s.id)
  }

  function loadBookings(eventId: string) {
    setLoading(true)
    fetch(`/api/admin/session-bookings?eventId=${eventId}`)
      .then(r => r.json())
      .then(d => { setBookings(d.bookings ?? []); setLoading(false) })
      .catch(() => { setBookings([]); setLoading(false) })
  }

  // Load bookings for first session on mount
  if (selectedSession && bookings === null && !loading) {
    loadBookings(selectedSession.id)
  }

  async function toggleAttendance(bookingId: string, current: 'present' | 'absent' | 'loading' | undefined) {
    const next = current === 'present' ? 'absent' : 'present'
    setAttended(a => ({ ...a, [bookingId]: 'loading' }))
    try {
      await fetch('/api/admin/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, attended: next === 'present' }),
      })
      setAttended(a => ({ ...a, [bookingId]: next }))
    } catch {
      setAttended(a => { const n = { ...a }; delete n[bookingId]; return n })
    }
  }

  const filteredBookings = (bookings ?? []).filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      b.contactDetails.firstName.toLowerCase().includes(q) ||
      b.contactDetails.lastName.toLowerCase().includes(q)  ||
      b.contactDetails.email.toLowerCase().includes(q)
    )
  })

  const checkedInCount = Object.values(attended).filter(v => v === 'present').length

  return (
    <div className="h-full flex overflow-hidden">

      {/* ── Session list ── */}
      <div className="w-72 shrink-0 border-r border-neutral-200 flex flex-col bg-white">
        <div className="px-4 py-4 border-b border-neutral-100">
          <h2 className="text-[13px] font-semibold text-neutral-900">Today&apos;s classes</h2>
          <p className="text-[11.5px] text-neutral-400 mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="px-4 py-8 text-sm text-neutral-400">No classes today.</p>
          ) : (
            sessions.map(s => {
              const name    = scheduleToName[s.scheduleId] ?? s.title
              const fill    = pct(s.bookedCount, s.capacity)
              const active  = selectedSession?.id === s.id
              const past    = new Date(s.end) < new Date()
              return (
                <button
                  key={s.id}
                  onClick={() => selectSession(s)}
                  className={`w-full text-left px-4 py-3.5 border-b border-neutral-100 transition-colors ${
                    active ? 'bg-black text-white' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[12px] font-medium truncate flex-1 pr-2 ${active ? 'text-white' : 'text-neutral-800'}`}>
                      {name}
                    </span>
                    {past && (
                      <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                        active ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-400'
                      }`}>Done</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] ${active ? 'text-white/70' : 'text-neutral-400'}`}>
                      {fmt12(s.start)} – {fmt12(s.end)}
                    </span>
                    <span className={`text-[11px] font-semibold ${active ? 'text-white/80' : 'text-neutral-500'}`}>
                      {s.bookedCount}/{s.capacity}
                    </span>
                  </div>
                  <div className={`h-1 rounded-full mt-2 ${active ? 'bg-white/20' : 'bg-neutral-100'}`}>
                    <div
                      className={`h-full rounded-full ${active ? 'bg-white' : fill >= 100 ? 'bg-red-400' : 'bg-black'}`}
                      style={{ width: `${Math.min(fill, 100)}%` }}
                    />
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Attendee panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {selectedSession ? (
          <>
            {/* Header */}
            <div className="shrink-0 px-6 py-4 border-b border-neutral-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-neutral-900">
                    {scheduleToName[selectedSession.scheduleId] ?? selectedSession.title}
                  </h2>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    {fmt12(selectedSession.start)} – {fmt12(selectedSession.end)} · {selectedSession.bookedCount}/{selectedSession.capacity} booked
                  </p>
                </div>
                {checkedInCount > 0 && (
                  <div className="text-right">
                    <p className="text-[10.5px] text-neutral-400 uppercase tracking-wider">Checked in</p>
                    <p className="text-2xl font-semibold text-neutral-900">{checkedInCount}</p>
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="mt-3 w-full h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
              />
            </div>

            {/* Attendee list */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <p className="px-6 py-8 text-sm text-neutral-400">Loading attendees…</p>
              )}
              {!loading && filteredBookings.length === 0 && (
                <p className="px-6 py-8 text-sm text-neutral-400">
                  {search ? 'No attendees match your search.' : 'No bookings for this session.'}
                </p>
              )}
              {filteredBookings.map((b, i) => {
                const state    = attended[b.id]
                const isIn     = state === 'present'
                const isLoading = state === 'loading'
                const name     = `${b.contactDetails.firstName} ${b.contactDetails.lastName}`.trim() || '—'
                const initials = `${b.contactDetails.firstName[0] ?? ''}${b.contactDetails.lastName[0] ?? ''}`.toUpperCase()

                return (
                  <div
                    key={b.id}
                    className={`flex items-center gap-4 px-6 py-3.5 ${
                      i < filteredBookings.length - 1 ? 'border-b border-neutral-100' : ''
                    } ${isIn ? 'bg-neutral-50' : ''}`}
                  >
                    <div className={`w-9 h-9 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0 ${
                      isIn ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-neutral-900">{name}</p>
                      <p className="text-[11.5px] text-neutral-400 truncate">{b.contactDetails.email}</p>
                    </div>
                    <button
                      onClick={() => toggleAttendance(b.id, state)}
                      disabled={isLoading}
                      className={`h-8 px-4 text-[12.5px] font-medium rounded-lg border transition-colors shrink-0 disabled:opacity-40 ${
                        isIn
                          ? 'bg-black text-white border-black hover:bg-neutral-800'
                          : 'bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black'
                      }`}
                    >
                      {isLoading ? '…' : isIn ? '✓ Checked in' : 'Check in'}
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-neutral-400">Select a session to see attendees.</p>
          </div>
        )}
      </div>
    </div>
  )
}
