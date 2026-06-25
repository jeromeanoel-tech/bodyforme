'use client'

import { useState, useEffect } from 'react'
import type { Session, Service, Staff, Booking } from '@/lib/db'
import { useSettings } from '@/lib/useSettings'

type Props = {
  initialSessions:    Session[]
  scheduleToService:  Record<string, Service>
  resourceToStaff:    Record<string, Staff>
  initialWeekOffset:  number
  instructors:        string[]
  templateNameBySlot: Record<string, string>
}

function melbDate(utcIso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne' }).format(new Date(utcIso))
}

function slotKey(utcIso: string): string {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(utcIso))
  const day = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? ''
  const h   = (parts.find(p => p.type === 'hour')?.value   ?? '0').padStart(2, '0')
  const mi  = (parts.find(p => p.type === 'minute')?.value ?? '0').padStart(2, '0')
  return `${day}:${h}:${mi}`
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function weekRange(offset: number) {
  const now = new Date()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7)
  mon.setHours(12, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  return { from: `${localDate(mon)}T00:00:00`, to: `${localDate(sun)}T23:59:59`, monday: mon }
}

function fmt12(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Melbourne',
    hour:     'numeric',
    minute:   '2-digit',
    hour12:   true,
  })
}

function dayLabel(date: Date) {
  return date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })
}

function dayLabelShort(date: Date) {
  return date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function isToday(date: Date, now: Date) {
  return date.toDateString() === now.toDateString()
}

export default function ScheduleClient({ initialSessions, scheduleToService, resourceToStaff, initialWeekOffset, instructors, templateNameBySlot }: Props) {
  const [weekOffset,       setWeekOffset]      = useState(initialWeekOffset)
  const [sessions,         setSessions]        = useState(initialSessions)
  const [loadingSessions,  setLoadingSessions] = useState(false)
  const [selectedSession,  setSelectedSession] = useState<Session | null>(null)
  const [autoConfirmCancel, setAutoConfirmCancel] = useState(false)
  const [search,           setSearch]          = useState('')
  const [cancelledIds,     setCancelledIds]    = useState<Set<string>>(new Set())
  const [now,              setNow]             = useState(() => new Date())
  const [menuOpenId,       setMenuOpenId]      = useState<string | null>(null)
  const [showSearch,       setShowSearch]      = useState(false)

  const { settings } = useSettings()

  // Keep sessions in sync with Classes template — runs silently on mount, then re-fetches current week
  useEffect(() => {
    const offset = weekOffset
    fetch('/api/admin/resync-all-sessions', { method: 'POST' })
      .then(async () => {
        const { from, to } = weekRange(offset)
        const res  = await fetch(`/api/admin/schedule-sessions?from=${from}&to=${to}`)
        const data = await res.json()
        setSessions(data.sessions ?? [])
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchSessions(offset: number) {
    const { from, to } = weekRange(offset)
    try {
      const res  = await fetch(`/api/admin/schedule-sessions?from=${from}&to=${to}`)
      const data = await res.json()
      setSessions(data.sessions ?? [])
    } catch { /* silent */ }
  }

  async function goToWeek(offset: number) {
    window.history.pushState(null, '', offset === 0 ? '/admin/schedule' : `/admin/schedule?week=${offset}`)
    setLoadingSessions(true)
    try {
      const { from, to } = weekRange(offset)
      const res  = await fetch(`/api/admin/schedule-sessions?from=${from}&to=${to}`)
      const data = await res.json()
      setWeekOffset(offset)
      setSessions(data.sessions ?? [])
      setCancelledIds(new Set())
    } finally {
      setLoadingSessions(false)
    }
  }

  useEffect(() => {
    const id = setInterval(() => fetchSessions(weekOffset), 60_000)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset])

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  function handleCancelled(id: string) {
    setCancelledIds(s => new Set([...s, id]))
  }

  function handleInstructorChange(sessionId: string, name: string) {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, instructor_name: name } : s))
  }

  const { monday } = weekRange(weekOffset)

  const days = DAYS.map((_, i) => {
    const date     = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dateStr  = localDate(date)
    const daySessions = sessions
      .filter(s => melbDate(s.start) === dateStr)
      .filter(s => settings.showCancelledClasses || (s.status !== 'CANCELLED' && !cancelledIds.has(s.id)))
      .filter(s => {
        if (!search) return true
        const svc   = scheduleToService[s.scheduleId]
        const staff = resourceToStaff[s.staffResourceId]
        const name = templateNameBySlot[slotKey(s.start)] || s.title || svc?.name || ''
        return (
          name.toLowerCase().includes(search.toLowerCase()) ||
          staff?.name.toLowerCase().includes(search.toLowerCase())
        )
      })
      .sort((a, b) => a.start.localeCompare(b.start))
    return { date, daySessions }
  })

  const totalSessions = sessions.length
  const totalBooked   = sessions.reduce((n, s) => n + s.bookedCount, 0)
  const totalCap      = sessions.reduce((n, s) => n + s.capacity, 0)

  const weekStart = monday.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
  const weekEnd   = new Date(monday.getTime() + 6 * 86400000).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="h-full flex flex-col">

      {/* ── Toolbar ── */}
      <div className="shrink-0 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2 px-4 md:px-6 py-3">
          {/* Week nav */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToWeek(weekOffset - 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-black transition-colors text-sm touch-manipulation"
            >‹</button>
            <span className="text-[12px] md:text-sm font-medium text-neutral-700 px-2 whitespace-nowrap">
              {weekStart} – {weekEnd}
            </span>
            <button
              onClick={() => goToWeek(weekOffset + 1)}
              className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 hover:border-neutral-400 hover:text-black transition-colors text-sm touch-manipulation"
            >›</button>
            {weekOffset !== 0 && (
              <button
                onClick={() => goToWeek(0)}
                className="h-8 px-3 text-xs rounded-lg border border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-black transition-colors ml-1 touch-manipulation"
              >
                Today
              </button>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            {loadingSessions && <span className="text-xs text-neutral-400 animate-pulse">Loading…</span>}

            {/* Search toggle — mobile only */}
            <button
              onClick={() => setShowSearch(v => !v)}
              className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:border-neutral-400 touch-manipulation"
              aria-label="Search"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>

            {/* Search input — always visible on desktop */}
            <input
              type="text"
              placeholder="Filter by class or instructor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="hidden md:block h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black w-56"
            />
            <span className="hidden md:flex h-8 px-3 text-sm rounded-lg border bg-black text-white border-black items-center">Week</span>
          </div>
        </div>

        {/* Mobile search row */}
        {showSearch && (
          <div className="md:hidden px-4 pb-3">
            <input
              type="text"
              placeholder="Filter by class or instructor..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
            />
          </div>
        )}
      </div>

      {/* ── Schedule ── */}
      <div className={`flex-1 overflow-y-auto transition-opacity duration-150 ${loadingSessions ? 'opacity-40' : 'opacity-100'}`}>
        {days.map(({ date, daySessions }) => (
          <section key={date.toISOString()}>

            {/* Day header */}
            <div className={`sticky top-0 z-10 border-b border-neutral-200 ${
              isToday(date, now) ? 'bg-neutral-100' : 'bg-neutral-50'
            }`}>
              {/* Mobile day header — simple label */}
              <div className="flex items-center gap-2 md:hidden px-4 py-2.5">
                <span className="text-[13px] font-semibold text-neutral-800">{dayLabelShort(date)}</span>
                {isToday(date, now) && (
                  <span className="text-[10px] font-semibold bg-black text-white px-2 py-0.5 rounded-full">TODAY</span>
                )}
                {daySessions.length > 0 && (
                  <span className="text-[11px] text-neutral-400 ml-auto">{daySessions.length} class{daySessions.length !== 1 ? 'es' : ''}</span>
                )}
              </div>
              {/* Desktop day header — grid with column labels */}
              <div
                className="hidden md:grid px-6 py-2"
                style={{ gridTemplateColumns: '160px 1fr 200px 160px 48px' }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-neutral-800">{dayLabel(date)}</span>
                  {isToday(date, now) && (
                    <span className="text-[10px] font-semibold bg-black text-white px-2 py-0.5 rounded-full">TODAY</span>
                  )}
                </div>
                <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider self-center">Class</span>
                <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider self-center">Instructor</span>
                <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider self-center">Sign In</span>
                <span />
              </div>
            </div>

            {daySessions.length === 0 ? (
              <div className="px-4 md:px-6 py-4 text-sm text-neutral-400 border-b border-neutral-100">No classes scheduled</div>
            ) : (
              daySessions.map(session => {
                const svc       = scheduleToService[session.scheduleId]
                const staff     = resourceToStaff[session.staffResourceId]
                const cancelled = session.status === 'CANCELLED'
                const pct       = session.capacity > 0 ? session.bookedCount / session.capacity : 0
                const full      = pct >= 1

                return (
                  <div key={session.id} className={cancelled ? 'opacity-50' : ''}>

                    {/* ── Mobile session row ── */}
                    <div
                      className={`md:hidden flex items-center gap-3 px-4 py-3 border-b border-neutral-100 ${
                        !cancelled ? 'hover:bg-neutral-50 active:bg-neutral-50 cursor-pointer' : ''
                      }`}
                      onClick={() => !cancelled && setSelectedSession(session)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-[11.5px] text-neutral-400 shrink-0">{fmt12(session.start)}</span>
                          <span className={`text-[13px] font-medium truncate ${cancelled ? 'line-through text-neutral-400' : 'text-neutral-800'}`}>
                            {templateNameBySlot[slotKey(session.start)] || session.title || svc?.name}
                          </span>
                          {cancelled && (
                            <span className="text-[10px] font-semibold bg-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0">
                              Cancelled
                            </span>
                          )}
                        </div>
                        {!cancelled && (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11.5px] text-neutral-400">{staff?.name ?? '—'}</span>
                            <span className={`text-[11.5px] font-semibold ${full ? 'text-red-500' : 'text-neutral-600'}`}>
                              · {session.bookedCount}/{session.capacity}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-700 transition-colors touch-manipulation"
                          onClick={() => setMenuOpenId(menuOpenId === session.id ? null : session.id)}
                        >
                          ⋯
                        </button>
                        {menuOpenId === session.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                            <div className="absolute right-0 top-9 z-20 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 text-[13px]">
                              <button
                                className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 text-neutral-700"
                                onClick={() => { setMenuOpenId(null); setSelectedSession(session) }}
                              >
                                View attendees
                              </button>
                              {!cancelled && (
                                <a
                                  href={`/admin/checkin?session=${session.id}`}
                                  className="block px-3 py-2.5 hover:bg-neutral-50 text-neutral-700"
                                  onClick={() => setMenuOpenId(null)}
                                >
                                  Check in
                                </a>
                              )}
                              {!cancelled && (
                                <button
                                  className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 text-red-600"
                                  onClick={() => { setMenuOpenId(null); setAutoConfirmCancel(true); setSelectedSession(session) }}
                                >
                                  Cancel class
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Desktop session row ── */}
                    <div
                      className={`hidden md:grid items-center px-6 py-3 border-b border-neutral-100 transition-colors ${
                        cancelled ? '' : 'hover:bg-neutral-50 cursor-pointer'
                      }`}
                      style={{ gridTemplateColumns: '160px 1fr 200px 160px 48px' }}
                      onClick={() => !cancelled && setSelectedSession(session)}
                    >
                      <span className={`text-[12px] ${cancelled ? 'text-neutral-400 line-through' : 'text-neutral-500'}`}>
                        {fmt12(session.start)} – {fmt12(session.end)}
                      </span>

                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 rounded shrink-0 ${cancelled ? 'bg-neutral-300' : 'bg-black'}`} />
                        <span className={`text-[12.5px] font-medium ${cancelled ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                          {templateNameBySlot[slotKey(session.start)] || session.title || svc?.name}
                        </span>
                        {cancelled && (
                          <span className="text-[10px] font-semibold bg-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            Cancelled
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-[14px] h-[14px] rounded border border-neutral-300 shrink-0" />
                        <span className="text-[12.5px] text-neutral-700">{staff?.name ?? '—'}</span>
                      </div>

                      {cancelled ? (
                        <span />
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${full ? 'bg-red-500' : 'bg-black'}`}
                              style={{ width: `${Math.min(pct * 100, 100)}%` }}
                            />
                          </div>
                          <span className={`text-[12px] font-semibold ${full ? 'text-red-500' : 'text-neutral-800'}`}>
                            {session.bookedCount}/{session.capacity}
                          </span>
                        </div>
                      )}

                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-700 transition-colors text-base"
                          onClick={() => setMenuOpenId(menuOpenId === session.id ? null : session.id)}
                        >
                          ⋯
                        </button>
                        {menuOpenId === session.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                            <div className="absolute right-0 top-8 z-20 w-44 bg-white border border-neutral-200 rounded-lg shadow-lg py-1 text-[13px]">
                              <button
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-neutral-700"
                                onClick={() => { setMenuOpenId(null); setSelectedSession(session) }}
                              >
                                View attendees
                              </button>
                              {!cancelled && (
                                <a
                                  href={`/admin/checkin?session=${session.id}`}
                                  className="block px-3 py-2 hover:bg-neutral-50 text-neutral-700"
                                  onClick={() => setMenuOpenId(null)}
                                >
                                  Check in
                                </a>
                              )}
                              {!cancelled && (
                                <button
                                  className="w-full text-left px-3 py-2 hover:bg-neutral-50 text-red-600"
                                  onClick={() => { setMenuOpenId(null); setAutoConfirmCancel(true); setSelectedSession(session) }}
                                >
                                  Cancel class
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </section>
        ))}

        {/* Weekly totals */}
        <div className="px-4 md:px-6 py-5 border-t border-neutral-200 bg-white flex items-center gap-6 md:gap-8">
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Sessions</p>
            <p className="text-xl font-semibold text-neutral-900 mt-0.5">{totalSessions}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Booked</p>
            <p className="text-xl font-semibold text-neutral-900 mt-0.5">{totalBooked}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Avg Fill</p>
            <p className="text-xl font-semibold text-neutral-900 mt-0.5">
              {totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {selectedSession && (
        <AttendeeDrawer
          session={selectedSession}
          serviceName={scheduleToService[selectedSession.scheduleId]?.name ?? selectedSession.title}
          staffName={resourceToStaff[selectedSession.staffResourceId]?.name}
          onClose={() => { setSelectedSession(null); setAutoConfirmCancel(false) }}
          onCancelled={handleCancelled}
          initialConfirmCancel={autoConfirmCancel}
          instructors={instructors}
          onInstructorChange={handleInstructorChange}
        />
      )}
    </div>
  )
}

// ── Attendee drawer ───────────────────────────────────────────────────────────

function AttendeeDrawer({
  session, serviceName, staffName, onClose, onCancelled, initialConfirmCancel, instructors, onInstructorChange,
}: {
  session:               Session
  serviceName:           string
  staffName?:            string
  onClose:               () => void
  onCancelled:           (id: string) => void
  initialConfirmCancel?: boolean
  instructors:           string[]
  onInstructorChange:    (sessionId: string, name: string) => void
}) {
  const [bookings,       setBookings]       = useState<Booking[] | null>(null)
  const [loading,        setLoading]        = useState(true)
  const [cancelling,     setCancelling]     = useState(false)
  const [confirmCancel,  setConfirmCancel]  = useState(initialConfirmCancel ?? false)
  const [editInstructor, setEditInstructor] = useState(false)
  const [instrValue,     setInstrValue]     = useState(staffName ?? '')
  const [instrSaving,    setInstrSaving]    = useState(false)

  useEffect(() => {
    let active = true
    fetch(`/api/admin/session-bookings?eventId=${session.id}`)
      .then(r => r.json())
      .then(d => { if (active) { setBookings(d.bookings ?? []); setLoading(false) } })
      .catch(() => { if (active) { setBookings([]); setLoading(false) } })
    return () => { active = false }
  }, [session.id])

  async function cancelSession() {
    setCancelling(true)
    await fetch('/api/admin/cancel-session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sessionId: session.id }),
    })
    setCancelling(false)
    onCancelled(session.id)
    onClose()
  }

  async function saveInstructor() {
    setInstrSaving(true)
    await fetch('/api/admin/sessions', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: session.id, instructorName: instrValue, applyToFuture: false }),
    })
    onInstructorChange(session.id, instrValue)
    setEditInstructor(false)
    setInstrSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      {/* Full-width on mobile, 380px panel on md+ */}
      <div className="relative w-full md:w-[380px] bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200">
        <div className="px-5 py-5 border-b border-neutral-200 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <h2 className="font-semibold text-neutral-900">{serviceName}</h2>
            {/* Instructor — editable */}
            {editInstructor ? (
              <div className="flex items-center gap-2 mt-1.5">
                <select value={instrValue} onChange={e => setInstrValue(e.target.value)}
                  className="h-7 px-2 text-[12px] border border-neutral-300 rounded-md outline-none focus:border-black bg-white">
                  <option value="">— Unassigned —</option>
                  {instructors.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <button onClick={saveInstructor} disabled={instrSaving}
                  className="h-7 px-2.5 text-[11px] font-medium bg-black text-white rounded-md disabled:opacity-40 touch-manipulation">
                  {instrSaving ? '…' : 'Save'}
                </button>
                <button onClick={() => { setEditInstructor(false); setInstrValue(staffName ?? '') }}
                  className="h-7 px-2 text-[11px] text-neutral-500 hover:text-neutral-800 touch-manipulation">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setEditInstructor(true)}
                className="flex items-center gap-1.5 mt-1 text-sm text-neutral-500 hover:text-neutral-800 group touch-manipulation">
                <span>{fmt12(session.start)} · {staffName ?? 'No instructor'} · {session.bookedCount}/{session.capacity} booked</span>
                <span className="text-[11px] text-neutral-300 group-hover:text-neutral-500 transition-colors">✏</span>
              </button>
            )}
            {!confirmCancel ? (
              <button
                onClick={() => setConfirmCancel(true)}
                className="mt-3 text-[11px] font-medium text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-2.5 py-1 rounded-md transition-colors touch-manipulation"
              >
                Cancel class
              </button>
            ) : (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-[11px] text-neutral-600">Cancel this class?</span>
                <button
                  onClick={cancelSession}
                  disabled={cancelling}
                  className="text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-md disabled:opacity-40 touch-manipulation"
                >
                  {cancelling ? '…' : 'Yes, cancel'}
                </button>
                <button
                  onClick={() => setConfirmCancel(false)}
                  className="text-[11px] text-neutral-500 hover:text-neutral-800 touch-manipulation"
                >
                  No
                </button>
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl mt-0.5 w-8 h-8 flex items-center justify-center touch-manipulation">×</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && <div className="px-5 py-8 text-sm text-neutral-400">Loading attendees…</div>}
          {!loading && bookings?.length === 0 && <div className="px-5 py-8 text-sm text-neutral-400">No bookings yet.</div>}
          {bookings?.map((b, i) => (
            <div key={b.id} className={`flex items-center justify-between px-5 py-3.5 ${i < bookings.length - 1 ? 'border-b border-neutral-100' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[11px] font-semibold text-neutral-600 shrink-0">
                  {b.contactDetails.firstName?.[0]}{b.contactDetails.lastName?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-neutral-900 truncate">
                    {b.contactDetails.firstName} {b.contactDetails.lastName}
                  </p>
                  <p className="text-[11.5px] text-neutral-400 truncate">{b.contactDetails.email}</p>
                </div>
              </div>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 shrink-0 ml-2">
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
