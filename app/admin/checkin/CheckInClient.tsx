'use client'

import { useState, useRef, useEffect } from 'react'
import type { Session, Service, Booking } from '@/lib/db'

type Props = {
  sessions:         Session[]
  services:         Service[]
  defaultSessionId?: string
}

type AttendeeState = Record<string, 'present' | 'absent' | 'loading'>
type MemberResult  = { id: string; firstName: string; lastName: string; email: string; status?: string; planOverride?: string; creditBalance?: number }

function fmt12(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Melbourne',
    hour:     'numeric',
    minute:   '2-digit',
    hour12:   true,
  })
}

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0
}

export default function CheckInClient({ sessions, services, defaultSessionId }: Props) {
  const [selectedSession, setSelectedSession] = useState<Session | null>(
    (defaultSessionId ? sessions.find(s => s.id === defaultSessionId) : null) ?? (sessions.length > 0 ? sessions[0] : null)
  )
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [loading, setLoading]   = useState(false)
  const [attended, setAttended] = useState<AttendeeState>({})

  const [search, setSearch]               = useState('')
  const [dbResults, setDbResults]         = useState<MemberResult[]>([])
  const [dbLoading, setDbLoading]         = useState(false)
  const [addingId, setAddingId]           = useState<string | null>(null)
  const [addError, setAddError]           = useState('')
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [walkInOpen, setWalkInOpen]       = useState(false)
  const [walkInQuery, setWalkInQuery]     = useState('')
  const [walkInResults, setWalkInResults] = useState<MemberResult[]>([])
  const [walkInLoading, setWalkInLoading] = useState(false)
  const [walkInAdding, setWalkInAdding]   = useState(false)
  const [walkInError, setWalkInError]     = useState('')
  const walkInDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedSessionRef = useRef<Session | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedSessionRef.current) loadBookings(selectedSessionRef.current.id)
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    if (search.length < 2) { setDbResults([]); return }
    searchDebounce.current = setTimeout(() => {
      setDbLoading(true)
      fetch(`/api/admin/search-members?q=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(d => { setDbResults(d.members ?? []); setDbLoading(false) })
        .catch(() => setDbLoading(false))
    }, 250)
  }, [search])

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

  async function addToSession(member: MemberResult, fromWalkIn = false) {
    if (!selectedSession) return
    if (fromWalkIn) setWalkInAdding(true)
    else setAddingId(member.id)
    setAddError('')
    setWalkInError('')

    const res = await fetch('/api/admin/book-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: member.id, sessionId: selectedSession.id }),
    })
    const data = await res.json()

    if (!res.ok) {
      const msg = data.error ?? 'Failed to add'
      if (fromWalkIn) { setWalkInError(msg); setWalkInAdding(false) }
      else { setAddError(msg); setAddingId(null) }
      return
    }

    setBookings(prev => {
      const exists = (prev ?? []).find(b => b.memberId === member.id)
      if (exists) return prev
      return [...(prev ?? []), data.booking]
    })
    setAttended(a => ({ ...a, [data.booking.id]: 'present' }))

    if (fromWalkIn) {
      setWalkInAdding(false)
      setWalkInOpen(false)
      setWalkInQuery('')
      setWalkInResults([])
    } else {
      setSearch('')
      setDbResults([])
      setAddingId(null)
    }
  }

  const scheduleToName = Object.fromEntries(services.map(s => [s.scheduleId, s.name]))

  function selectSession(s: Session) {
    setSelectedSession(s)
    selectedSessionRef.current = s
    setBookings(null)
    setAttended({})
    setSearch('')
    setDbResults([])
    setAddError('')
    setWalkInOpen(false)
    loadBookings(s.id)
  }

  function loadBookings(eventId: string) {
    setLoading(true)
    fetch(`/api/admin/session-bookings?eventId=${eventId}`)
      .then(r => r.json())
      .then(d => {
        const bookings: Booking[] = d.bookings ?? []
        setBookings(bookings)
        const init: AttendeeState = {}
        bookings.forEach(b => { if (b.attended) init[b.id] = 'present' })
        setAttended(init)
        setLoading(false)
      })
      .catch(() => { setBookings([]); setLoading(false) })
  }

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

  const bookedIds = new Set((bookings ?? []).map(b => b.memberId))

  const filteredBookings = (bookings ?? []).filter(b => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      b.contactDetails.firstName.toLowerCase().includes(q) ||
      b.contactDetails.lastName.toLowerCase().includes(q)  ||
      b.contactDetails.email.toLowerCase().includes(q)
    )
  })

  const unbookedSuggestions = dbResults.filter(m => !bookedIds.has(m.id))
  const checkedInCount = Object.values(attended).filter(v => v === 'present').length

  return (
    <div className="h-full flex flex-col md:flex-row overflow-hidden">

      {/* ── Mobile: horizontal session strip ── */}
      <div className="md:hidden shrink-0 bg-white border-b border-neutral-200">
        <div className="px-3 py-2 text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">
          Today&apos;s classes · {sessions.length} session{sessions.length !== 1 ? 's' : ''}
        </div>
        {sessions.length === 0 ? (
          <p className="px-4 pb-3 text-sm text-neutral-400">No classes today.</p>
        ) : (
          <div className="flex gap-2 px-3 pb-3 overflow-x-auto">
            {sessions.map(s => {
              const name   = scheduleToName[s.scheduleId] ?? s.title
              const active = selectedSession?.id === s.id
              const past   = new Date(s.end) < new Date()
              return (
                <button
                  key={s.id}
                  onClick={() => selectSession(s)}
                  className={`flex-none text-left px-3 py-2.5 rounded-xl border min-w-[150px] transition-colors touch-manipulation ${
                    active
                      ? 'bg-black text-white border-black'
                      : 'bg-white border-neutral-200 text-neutral-800'
                  }`}
                >
                  <p className={`text-[12.5px] font-semibold truncate ${active ? 'text-white' : 'text-neutral-900'}`}>
                    {name}
                  </p>
                  <p className={`text-[11px] mt-0.5 ${active ? 'text-white/70' : 'text-neutral-400'}`}>
                    {fmt12(s.start)} · {s.bookedCount}/{s.capacity}
                    {past && <span className="ml-1 opacity-60">· Done</span>}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Desktop: vertical session list ── */}
      <div className="hidden md:flex w-72 shrink-0 border-r border-neutral-200 flex-col bg-white">
        <div className="px-4 py-4 border-b border-neutral-100">
          <h2 className="text-[13px] font-semibold text-neutral-900">Today&apos;s classes</h2>
          <p className="text-[11.5px] text-neutral-400 mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <p className="px-4 py-8 text-sm text-neutral-400">No classes today.</p>
          ) : (
            sessions.map(s => {
              const name   = scheduleToName[s.scheduleId] ?? s.title
              const fill   = pct(s.bookedCount, s.capacity)
              const active = selectedSession?.id === s.id
              const past   = new Date(s.end) < new Date()
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {selectedSession ? (
          <>
            {/* Header */}
            <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-b border-neutral-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <h2 className="text-[14px] md:text-[15px] font-semibold text-neutral-900 truncate">
                    {scheduleToName[selectedSession.scheduleId] ?? selectedSession.title}
                  </h2>
                  <p className="text-[11.5px] text-neutral-400 mt-0.5">
                    {fmt12(selectedSession.start)} – {fmt12(selectedSession.end)} · {selectedSession.bookedCount}/{selectedSession.capacity} booked
                  </p>
                </div>
                {checkedInCount > 0 && (
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider">In</p>
                    <p className="text-2xl font-semibold text-neutral-900">{checkedInCount}</p>
                  </div>
                )}
              </div>

              {/* Search + casual button */}
              <div className="mt-3 flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search by name or email…"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setAddError('') }}
                    className="w-full h-10 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                  />
                  {unbookedSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 border border-neutral-200 rounded-lg bg-white shadow-md z-10 overflow-hidden">
                      <p className="px-3 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-50 border-b border-neutral-100">
                        Not booked — tap to add
                      </p>
                      {unbookedSuggestions.map((m, i) => {
                        const isInactive = m.status === 'inactive'
                        return (
                          <div key={m.id} className={`flex items-center justify-between px-3 py-3 ${i > 0 ? 'border-t border-neutral-100' : ''} ${isInactive ? 'bg-red-50' : ''}`}>
                            <div className="min-w-0 mr-2">
                              <div className="flex items-center gap-1.5">
                                <p className="text-[13px] font-medium text-neutral-900">{m.firstName} {m.lastName}</p>
                                {isInactive && <span className="text-[9.5px] font-semibold bg-red-500 text-white px-1.5 py-0.5 rounded-full shrink-0">Inactive</span>}
                              </div>
                              {isInactive
                                ? <p className="text-[11px] text-red-500 mt-0.5">Membership expired — must renew before check-in</p>
                                : <p className="text-[11px] text-neutral-400 truncate">{m.email}</p>
                              }
                            </div>
                            {isInactive ? (
                              <a
                                href={`/admin/pos?client=${encodeURIComponent(m.email ?? '')}&product=renew`}
                                className="h-9 px-3 text-[12px] font-medium rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors shrink-0 touch-manipulation flex items-center"
                              >
                                Renew
                              </a>
                            ) : (
                              <button
                                onClick={() => addToSession(m)}
                                disabled={addingId === m.id}
                                className="h-9 px-3 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition-colors shrink-0 touch-manipulation"
                              >
                                {addingId === m.id ? '…' : 'Add'}
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setWalkInOpen(true); setWalkInQuery(''); setWalkInResults([]); setWalkInError('') }}
                  className="h-10 px-3 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors shrink-0 touch-manipulation"
                >
                  + Casual
                </button>
              </div>
              {addError && <p className="text-[12px] text-red-500 mt-1.5">{addError}</p>}
              {search.length >= 2 && !dbLoading && unbookedSuggestions.length === 0 && filteredBookings.length === 0 && (
                <p className="text-[12px] text-neutral-400 mt-1.5">No members found for &quot;{search}&quot;.</p>
              )}
            </div>

            {/* Casual walk-in panel */}
            {walkInOpen && (
              <div className="shrink-0 border-b border-neutral-200 bg-amber-50 px-4 md:px-6 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[13px] font-semibold text-neutral-900">Add casual walk-in</p>
                  <button onClick={() => setWalkInOpen(false)} className="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 text-lg touch-manipulation">✕</button>
                </div>
                <input
                  type="text"
                  placeholder="Search member by name or email…"
                  value={walkInQuery}
                  onChange={e => setWalkInQuery(e.target.value)}
                  autoFocus
                  className="w-full h-10 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black bg-white"
                />
                {walkInError && <p className="text-[12px] text-red-600 mt-2">{walkInError}</p>}
                {walkInLoading && <p className="text-[12px] text-neutral-400 mt-2">Searching…</p>}
                {walkInResults.length > 0 && (
                  <div className="mt-2 border border-neutral-200 rounded-lg bg-white overflow-hidden">
                    {walkInResults.map((m, i) => {
                      const alreadyIn = (bookings ?? []).some(b => b.memberId === m.id)
                      return (
                        <div key={m.id} className={`flex items-center justify-between px-3 py-3 ${i > 0 ? 'border-t border-neutral-100' : ''}`}>
                          <div className="min-w-0 mr-2">
                            <p className="text-[13px] font-medium text-neutral-900">{m.firstName} {m.lastName}</p>
                            <p className="text-[11px] text-neutral-400 truncate">{m.email}</p>
                          </div>
                          {alreadyIn ? (
                            <span className="text-[11px] text-neutral-400 italic shrink-0">Already booked</span>
                          ) : (
                            <button
                              onClick={() => addToSession(m, true)}
                              disabled={walkInAdding}
                              className="h-9 px-3 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 touch-manipulation shrink-0"
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
                  <p className="text-[12px] text-neutral-400 mt-2">No members found. Check spelling or add them via Clients first.</p>
                )}
              </div>
            )}

            {/* Attendee list */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <p className="px-4 py-8 text-sm text-neutral-400">Loading attendees…</p>
              )}
              {!loading && filteredBookings.length === 0 && (
                <p className="px-4 py-8 text-sm text-neutral-400">
                  {search ? 'No booked attendees match your search.' : 'No bookings for this session yet.'}
                </p>
              )}
              {filteredBookings.map((b, i) => {
                const state     = attended[b.id]
                const isIn      = state === 'present'
                const isLoading = state === 'loading'
                const name      = `${b.contactDetails.firstName} ${b.contactDetails.lastName}`.trim() || '—'
                const initials  = `${b.contactDetails.firstName[0] ?? ''}${b.contactDetails.lastName[0] ?? ''}`.toUpperCase()

                const hasPlan   = !!b.planOverride
                const isExpired = b.memberStatus === 'inactive' || b.memberStatus === 'expired'
                const noClasses = b.classesRemaining !== null && b.classesRemaining === 0
                const showSell  = !hasPlan || isExpired || noClasses

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
                    className={`px-4 md:px-6 py-3 md:py-3.5 ${
                      i < filteredBookings.length - 1 ? 'border-b border-neutral-100' : ''
                    } ${isIn ? 'bg-neutral-50' : ''}`}
                  >
                    {/* Mobile layout: stacked */}
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0 ${
                        isIn ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                        {initials}
                      </div>

                      <div className="flex-1 min-w-0">
                        <a
                          href={`/admin/clients?client=${b.memberId}`}
                          className="text-[13px] font-medium text-neutral-900 hover:underline hover:text-black"
                        >
                          {name}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <p className={`text-[11.5px] font-semibold ${classesColour}`}>{classesLabel}</p>
                          {hasPlan && !isExpired && (
                            <p className="text-[10.5px] text-neutral-400 truncate">{b.planOverride.split(' –')[0]}</p>
                          )}
                        </div>
                      </div>

                      {isExpired && !isIn ? (
                        <a
                          href={`/admin/pos?client=${encodeURIComponent(b.contactDetails.email)}&product=renew`}
                          className="h-10 px-3 text-[12px] font-medium rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 transition-colors shrink-0 touch-manipulation flex items-center"
                        >
                          Renew
                        </a>
                      ) : (
                        <button
                          onClick={() => toggleAttendance(b.id, state)}
                          disabled={isLoading}
                          className={`h-10 px-3 text-[12px] font-medium rounded-lg border transition-colors shrink-0 disabled:opacity-40 touch-manipulation ${
                            isIn
                              ? 'bg-black text-white border-black hover:bg-neutral-800'
                              : 'bg-white text-neutral-600 border-neutral-200 hover:border-black hover:text-black'
                          }`}
                        >
                          {isLoading ? '…' : isIn ? '✓ In' : 'Check in'}
                        </button>
                      )}
                    </div>

                    {/* Sell buttons row */}
                    {showSell && (
                      <div className="flex gap-2 mt-2 ml-12">
                        <a
                          href={`/admin/pos?client=${encodeURIComponent(b.contactDetails.email)}&product=casual`}
                          className="h-8 px-3 text-[11px] font-medium rounded border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center touch-manipulation"
                        >
                          Sell casual
                        </a>
                        {(isExpired || hasPlan) && (
                          <a
                            href={`/admin/pos?client=${encodeURIComponent(b.contactDetails.email)}&product=renew`}
                            className="h-8 px-3 text-[11px] font-medium rounded border border-neutral-200 bg-white text-neutral-600 hover:border-black hover:text-black transition-colors flex items-center touch-manipulation"
                          >
                            Renew
                          </a>
                        )}
                      </div>
                    )}
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
