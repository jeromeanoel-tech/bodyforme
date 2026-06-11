'use client'

import { useState, useRef, useEffect } from 'react'
import type { WixSession, WixService, WixBooking } from '@/lib/db'

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

  // Casual state
  const [walkInOpen, setWalkInOpen]         = useState(false)
  const [walkInQuery, setWalkInQuery]       = useState('')
  const [walkInResults, setWalkInResults]   = useState<{ id: string; firstName: string; lastName: string; email: string }[]>([])
  const [walkInLoading, setWalkInLoading]   = useState(false)
  const [walkInAdding, setWalkInAdding]     = useState(false)
  const [walkInError, setWalkInError]       = useState('')
  const walkInDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (walkInDebounce.current) clearTimeout(walkInDebounce.current)
    if (walkInQuery.length < 2) { setWalkInResults([]); return }
    walkInDebounce.current = setTimeout(() => {
      setWalkInLoading(true)
      fetch(`/api/admin/search-members?q=${encodeURIComponent(walkInQuery)}`)
        .then(r => r.json())
        .then(d => { setWalkInResults(d.members ?? []); setWalkInLoading(false) })
        .catch(() => setWalkInLoading(false))
    }, 250)
  }, [walkInQuery])

  async function addWalkIn(member: { id: string; firstName: string; lastName: string; email: string }) {
    if (!selectedSession) return
    setWalkInAdding(true)
    setWalkInError('')
    const res = await fetch('/api/admin/book-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id, sessionId: selectedSession.id }),
    })
    const data = await res.json()
    if (!res.ok) { setWalkInError(data.error ?? 'Failed to add casual'); setWalkInAdding(false); return }

    // Add to bookings list and mark as present
    setBookings(prev => {
      const existing = (prev ?? []).find(b => b.memberId === member.id)
      if (existing) return prev
      return [...(prev ?? []), data.booking]
    })
    setAttended(a => ({ ...a, [data.booking.id]: 'present' }))
    setWalkInAdding(false)
    setWalkInOpen(false)
    setWalkInQuery('')
    setWalkInResults([])
  }

  const scheduleToName = Object.fromEntries(services.map(s => [s.scheduleId, s.name]))

  function selectSession(s: WixSession) {
    setSelectedSession(s)
    setBookings(null)
    setAttended({})  // will be re-populated from DB when bookings load
    setSearch('')
    loadBookings(s.id)
  }

  function loadBookings(eventId: string) {
    setLoading(true)
    fetch(`/api/admin/session-bookings?eventId=${eventId}`)
      .then(r => r.json())
      .then(d => {
        const bookings: WixBooking[] = d.bookings ?? []
        setBookings(bookings)
        // Pre-populate attended state from DB so Suzanne sees who's already been checked in
        const initialAttended: AttendeeState = {}
        bookings.forEach(b => { if (b.attended) initialAttended[b.id] = 'present' })
        setAttended(initialAttended)
        setLoading(false)
      })
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
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="flex-1 h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                />
                <button
                  onClick={() => { setWalkInOpen(true); setWalkInQuery(''); setWalkInResults([]); setWalkInError('') }}
                  className="h-8 px-3 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors shrink-0"
                >
                  + Casual
                </button>
              </div>
            </div>

            {/* Casual panel */}
            {walkInOpen && (
              <div className="shrink-0 border-b border-neutral-200 bg-amber-50 px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold text-neutral-900">Add casual</p>
                  <button onClick={() => setWalkInOpen(false)} className="text-neutral-400 hover:text-neutral-700">✕</button>
                </div>
                <input
                  type="text"
                  placeholder="Search member by name or email…"
                  value={walkInQuery}
                  onChange={e => setWalkInQuery(e.target.value)}
                  autoFocus
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black bg-white"
                />
                {walkInError && <p className="text-[12px] text-red-600 mt-2">{walkInError}</p>}
                {walkInLoading && <p className="text-[12px] text-neutral-400 mt-2">Searching…</p>}
                {walkInResults.length > 0 && (
                  <div className="mt-2 border border-neutral-200 rounded-lg bg-white overflow-hidden">
                    {walkInResults.map((m, i) => {
                      const alreadyIn = (bookings ?? []).some(b => b.memberId === m.id)
                      return (
                        <div key={m.id} className={`flex items-center justify-between px-3 py-2.5 ${i > 0 ? 'border-t border-neutral-100' : ''}`}>
                          <div>
                            <p className="text-[13px] font-medium text-neutral-900">{m.firstName} {m.lastName}</p>
                            <p className="text-[11px] text-neutral-400">{m.email}</p>
                          </div>
                          {alreadyIn ? (
                            <span className="text-[11px] text-neutral-400 italic">Already booked</span>
                          ) : (
                            <button
                              onClick={() => addWalkIn(m)}
                              disabled={walkInAdding}
                              className="h-7 px-3 text-[11.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40"
                            >
                              {walkInAdding ? '…' : 'Add & check in'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                {walkInQuery.length >= 2 && !walkInLoading && walkInResults.length === 0 && (
                  <p className="text-[12px] text-neutral-400 mt-2">No members found. Check spelling or create them via Clients first.</p>
                )}
              </div>
            )}

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
                const state     = attended[b.id]
                const isIn      = state === 'present'
                const isLoading = state === 'loading'
                const name      = `${b.contactDetails.firstName} ${b.contactDetails.lastName}`.trim() || '—'
                const initials  = `${b.contactDetails.firstName[0] ?? ''}${b.contactDetails.lastName[0] ?? ''}`.toUpperCase()

                const hasPlan    = !!b.planOverride
                const isExpired  = b.memberStatus === 'inactive' || b.memberStatus === 'expired'
                const noClasses  = b.classesRemaining !== null && b.classesRemaining === 0
                const showSell   = !hasPlan || isExpired || noClasses

                let classesLabel: string
                let classesColour: string
                if (!hasPlan) {
                  classesLabel  = 'No plan'
                  classesColour = 'text-neutral-400'
                } else if (isExpired) {
                  classesLabel  = 'Expired'
                  classesColour = 'text-red-500'
                } else if (b.classesRemaining === null) {
                  classesLabel  = 'Unlimited'
                  classesColour = 'text-emerald-600'
                } else if (b.classesRemaining === 0) {
                  classesLabel  = '0 left'
                  classesColour = 'text-red-500'
                } else if (b.classesRemaining <= 2) {
                  classesLabel  = `${b.classesRemaining} left`
                  classesColour = 'text-amber-500'
                } else {
                  classesLabel  = `${b.classesRemaining} left`
                  classesColour = 'text-neutral-600'
                }

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

                    {/* Classes remaining */}
                    <div className="w-24 shrink-0 text-right">
                      <p className={`text-[12px] font-semibold ${classesColour}`}>{classesLabel}</p>
                      {hasPlan && !isExpired && (
                        <p className="text-[10.5px] text-neutral-400 truncate">{b.planOverride.split(' –')[0]}</p>
                      )}
                    </div>

                    {/* Sell casual / renew button */}
                    {showSell && (
                      <div className="flex gap-1.5 shrink-0">
                        <a
                          href={`/admin/pos?client=${encodeURIComponent(b.contactDetails.email)}&product=casual`}
                          className="h-7 px-2.5 text-[11px] font-medium rounded border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center"
                        >
                          Sell casual
                        </a>
                        {(isExpired || hasPlan) && (
                          <a
                            href={`/admin/pos?client=${encodeURIComponent(b.contactDetails.email)}&product=renew`}
                            className="h-7 px-2.5 text-[11px] font-medium rounded border border-neutral-200 bg-white text-neutral-600 hover:border-black hover:text-black transition-colors flex items-center"
                          >
                            Renew
                          </a>
                        )}
                      </div>
                    )}

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
