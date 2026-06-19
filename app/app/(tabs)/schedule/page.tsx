'use client'

import { useState, useEffect } from 'react'
import type { WixSession, MemberBooking } from '@/lib/db'

const T = {
  linen:  '#f4ede1',
  l2:     '#ede4d4',
  esp:    '#2a1506',
  brown:  '#7a4a2a',
  sand:   '#c4a882',
  mid:    '#6b4e36',
  muted:  '#a08568',
  rule:   '#d8ccba',
  canvas: '#fdfaf6',
  rust:   '#9a5a3a',
  sage:   '#7a9478',
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function localDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekDays(weekOffset = 0): { date: Date; iso: string }[] {
  const today = new Date()
  const day   = today.getDay()
  const mon   = new Date(today)
  mon.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7)
  mon.setHours(12, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return { date: d, iso: localDate(d) }
  })
}

function fmt12(iso: string) {
  if (!iso) return ''
  const [, time] = iso.split('T')
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  const ampm   = h < 12 ? 'am' : 'pm'
  const h12    = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function classColor(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('bikram'))                           return '#9a5a3a'
  if (t.includes('yin'))                              return '#8a7da0'
  if (t.includes('pilates'))                          return '#7a9478'
  if (t.includes('hiit') || t.includes('tabata'))    return '#8a9ab0'
  if (t.includes('special') || t.includes('forces')) return '#b0906a'
  if (t.includes('aaa'))                              return '#7a4a2a'
  return '#a08568'
}

function classDuration(start: string, end: string): string {
  if (!start || !end) return ''
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const m = Math.round((e - s) / 60000)
  return `${m} min`
}

type BookedMap    = Record<string, { bookingId: string }>
type WaitlistMap  = Record<string, true>

function SkeletonCard() {
  return (
    <div className="skeleton-pulse" style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '16px 20px', borderBottom: `1px solid ${T.rule}`,
    }}>
      <div style={{ width: 3, height: 48, background: T.rule, borderRadius: 2, flexShrink: 0 }} />
      <div style={{ width: 50, flexShrink: 0 }}>
        <div style={{ width: 44, height: 22, background: T.rule, borderRadius: 3 }} />
        <div style={{ width: 32, height: 10, background: T.l2, borderRadius: 3, marginTop: 6 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ width: '55%', height: 10, background: T.l2, borderRadius: 3, marginBottom: 7 }} />
        <div style={{ width: '80%', height: 18, background: T.rule, borderRadius: 3, marginBottom: 7 }} />
        <div style={{ width: '40%', height: 10, background: T.l2, borderRadius: 3 }} />
      </div>
      <div style={{ width: 52, height: 32, background: T.rule, borderRadius: 2, flexShrink: 0 }} />
    </div>
  )
}

export default function SchedulePage() {
  const todayISO  = localDate(new Date())

  const [weekOffset, setWeekOffset] = useState(0)
  const weekDays  = getWeekDays(weekOffset)
  const defaultIdx = weekOffset === 0 ? (weekDays.findIndex(d => d.iso === todayISO) >= 0 ? weekDays.findIndex(d => d.iso === todayISO) : 0) : 0

  const [selIdx,       setSelIdx]       = useState(defaultIdx)
  const [sessions,     setSessions]     = useState<WixSession[]>([])
  const [staffMap,     setStaffMap]     = useState<Record<string, string>>({})
  const [bookedMap,    setBookedMap]    = useState<BookedMap>({})
  const [waitlistMap,  setWaitlistMap]  = useState<WaitlistMap>({})
  const [loading,      setLoading]      = useState(true)
  const [pending,      setPending]      = useState<string | null>(null)
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null)
  // Ticks every 30 s so isPast status updates without a page reload
  const [now,          setNow]          = useState(() => new Date())

  function fetchWeek(offset: number) {
    const days = getWeekDays(offset)
    const from = days[0].iso
    const to   = days[6].iso
    return Promise.all([
      fetch(`/api/app/schedule?from=${from}T00:00:00&to=${to}T23:59:59`).then(r => r.json()),
      fetch(`/api/app/my-bookings?from=${from}&to=${to}`).then(r => r.json()),
      fetch(`/api/app/waitlist?from=${from}&to=${to}`).then(r => r.json()).catch(() => ({ sessionIds: [] })),
    ]).then(([schedData, bookingsData, waitlistData]) => {
      setSessions(schedData.sessions ?? [])
      setStaffMap(schedData.resourceToStaff ?? {})
      const bm: BookedMap = {}
      ;(bookingsData.bookings as MemberBooking[] ?? []).forEach(b => {
        if (b.status === 'CONFIRMED') bm[b.sessionId] = { bookingId: b.bookingId }
      })
      setBookedMap(bm)
      const wm: WaitlistMap = {}
      ;(waitlistData.sessionIds as string[] ?? []).forEach(id => { wm[id] = true })
      setWaitlistMap(wm)
    })
  }

  useEffect(() => {
    setLoading(true)
    fetchWeek(weekOffset).catch(() => {}).finally(() => setLoading(false))

    // Re-fetch every 60 s so booking availability stays current
    const fetchId = setInterval(() => {
      fetchWeek(weekOffset).catch(() => {})
    }, 60_000)

    return () => clearInterval(fetchId)
  }, [weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tick every 30 s to update past/upcoming status live
  useEffect(() => {
    const tickId = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(tickId)
  }, [])

  useEffect(() => {
    const days = getWeekDays(weekOffset)
    const todayIdx = days.findIndex(d => d.iso === todayISO)
    setSelIdx(weekOffset === 0 && todayIdx >= 0 ? todayIdx : 0)
  }, [weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  function showToast(msg: string, ok: boolean) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 2800)
  }

  async function handleBook(sessionId: string) {
    if (pending) return
    setPending(sessionId)
    try {
      const res  = await fetch('/api/app/book', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (res.ok) {
        setBookedMap(m => ({ ...m, [sessionId]: { bookingId: data.bookingId } }))
        setSessions(s => s.map(x => x.id === sessionId ? { ...x, bookedCount: x.bookedCount + 1 } : x))
        showToast("You're booked in!", true)
      } else {
        showToast(data.error ?? 'Booking failed', false)
      }
    } catch {
      showToast('Network error', false)
    } finally {
      setPending(null)
    }
  }

  async function handleCancel(sessionId: string, bookingId: string) {
    if (pending) return
    setPending(sessionId)
    try {
      const res = await fetch('/api/app/cancel-booking', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookingId }),
      })
      if (res.ok) {
        setBookedMap(m => { const n = { ...m }; delete n[sessionId]; return n })
        setSessions(s => s.map(x => x.id === sessionId ? { ...x, bookedCount: Math.max(0, x.bookedCount - 1) } : x))
        showToast('Booking cancelled', true)
      } else {
        showToast('Cancel failed', false)
      }
    } catch {
      showToast('Network error', false)
    } finally {
      setPending(null)
    }
  }

  async function handleJoinWaitlist(sessionId: string) {
    if (pending) return
    setPending(sessionId)
    try {
      const res = await fetch('/api/app/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId }),
      })
      if (res.ok) {
        setWaitlistMap(m => ({ ...m, [sessionId]: true }))
        showToast("You're on the waitlist — we'll email you if a spot opens", true)
      } else {
        showToast('Could not join waitlist', false)
      }
    } catch {
      showToast('Network error', false)
    } finally {
      setPending(null)
    }
  }

  async function handleLeaveWaitlist(sessionId: string) {
    if (pending) return
    setPending(sessionId)
    try {
      const res = await fetch('/api/app/waitlist', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId }),
      })
      if (res.ok) {
        setWaitlistMap(m => { const n = { ...m }; delete n[sessionId]; return n })
        showToast('Removed from waitlist', true)
      }
    } catch {
      showToast('Network error', false)
    } finally {
      setPending(null)
    }
  }

  const selectedISO = weekDays[selIdx].iso
  const dayClasses  = sessions
    .filter(s => s.start.startsWith(selectedISO) && s.status !== 'CANCELLED')
    .sort((a, b) => a.start.localeCompare(b.start))

  const startMonth = new Intl.DateTimeFormat('en-AU', { month: 'long' }).format(weekDays[0].date)
  const endMonth   = new Intl.DateTimeFormat('en-AU', { month: 'short' }).format(weekDays[6].date)
  const crossMonth = weekDays[0].date.getMonth() !== weekDays[6].date.getMonth()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.linen, overflow: 'hidden' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 64, left: '50%', transform: 'translateX(-50%)',
          background: toast.ok ? T.esp : T.rust,
          color: T.linen, padding: '10px 20px',
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, fontWeight: 500,
          letterSpacing: '0.06em', zIndex: 100, pointerEvents: 'none',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          maxWidth: 'calc(100vw - 40px)', textAlign: 'center',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{
        height: 56, padding: '0 20px', borderBottom: `1px solid ${T.rule}`,
        background: T.linen, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <img src="/bodyforme-wordmark.png" alt="BodyForme" style={{ height: 18, width: 'auto' }} />
        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 20, fontStyle: 'italic', color: T.esp }}>Schedule</div>
      </div>

      {/* Week label */}
      <div style={{ padding: '18px 20px 10px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted }}>Week of</div>
          <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 24, fontWeight: 400, color: T.esp, marginTop: 2 }}>
            <em style={{ color: T.brown }}>{startMonth}</em>{' '}
            {weekDays[0].date.getDate()}–{crossMonth ? `${weekDays[6].date.getDate()} ${endMonth}` : weekDays[6].date.getDate()}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {weekOffset > 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              style={{
                height: 32, padding: '0 10px',
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: T.brown, background: 'none', border: `1px solid ${T.rule}`, cursor: 'pointer',
              }}
            >
              Today
            </button>
          )}
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            disabled={weekOffset === 0}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${T.rule}`, cursor: weekOffset === 0 ? 'not-allowed' : 'pointer', opacity: weekOffset === 0 ? 0.35 : 1 }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7.5 2.5L4.5 6L7.5 9.5" stroke={T.esp} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${T.rule}`, cursor: 'pointer' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4.5 2.5L7.5 6L4.5 9.5" stroke={T.esp} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {/* Day pills */}
      <div style={{ padding: '4px 14px 14px', display: 'flex', gap: 5, flexShrink: 0 }}>
        {weekDays.map((d, i) => {
          const on    = i === selIdx
          const today = d.iso === todayISO
          return (
            <button key={i} onClick={() => setSelIdx(i)} style={{
              flex: 1, height: 60, borderRadius: 4,
              background: on ? T.esp : 'transparent',
              border: on ? 'none' : `1px solid ${T.rule}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              cursor: 'pointer', padding: 0,
            }}>
              <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 8, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: on ? 'rgba(244,237,225,.6)' : T.muted }}>{DAYS[i]}</span>
              <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 20, fontWeight: 400, color: on ? T.linen : T.esp, lineHeight: 1 }}>{d.date.getDate()}</span>
              {today && !on && <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.brown, display: 'block' }} />}
            </button>
          )
        })}
      </div>

      {/* Class list */}
      <div style={{ flex: 1, overflowY: 'auto', borderTop: `1px solid ${T.rule}`, background: T.canvas }}>
        <div style={{ padding: '12px 20px 8px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: T.muted }}>
          {DAYS[selIdx]} · {loading ? '…' : `${dayClasses.length} class${dayClasses.length !== 1 ? 'es' : ''}`}
        </div>

        {/* Skeleton cards while loading */}
        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}

        {!loading && dayClasses.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 22, color: T.mid, fontStyle: 'italic' }}>No classes today</div>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, color: T.muted, marginTop: 8 }}>Try a different day or week</div>
          </div>
        )}

        {dayClasses.map(s => {
          const spots       = s.capacity - s.bookedCount
          const isFull      = spots <= 0
          const isLow       = spots > 0 && spots <= 3
          const isBooked    = !!bookedMap[s.id]
          const onWaitlist  = !!waitlistMap[s.id]
          const isPast      = new Date(s.start) < now
          const inFlight    = pending === s.id
          const color       = classColor(s.title)
          const duration    = classDuration(s.start, s.end)
          const teacher     = staffMap[s.staffResourceId] ?? ''

          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '16px 20px', borderBottom: `1px solid ${T.rule}`,
              background: isBooked ? 'rgba(122,148,120,0.06)' : onWaitlist ? 'rgba(160,133,104,0.06)' : 'transparent',
              opacity: (isFull && !isBooked && !onWaitlist) || isPast ? 0.55 : 1,
            }}>
              {/* Color dot */}
              <div style={{ width: 3, height: 48, background: isBooked ? T.sage : onWaitlist ? T.sand : color, borderRadius: 2, flexShrink: 0 }} />

              {/* Time */}
              <div style={{ width: 50, flexShrink: 0 }}>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 20, fontWeight: 400, color: T.esp, lineHeight: 1 }}>{fmt12(s.start)}</div>
                {duration && <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, color: T.muted, marginTop: 3, letterSpacing: '0.04em' }}>{duration}</div>}
              </div>

              {/* Class info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 3 }}>
                  {s.title.split('(')[0].trim()}
                </div>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 18, fontStyle: 'italic', color: T.esp, lineHeight: 1.1 }}>{s.title}</div>
                {teacher && <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: T.mid, marginTop: 3 }}>w/ {teacher}</div>}
              </div>

              {/* Action */}
              <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                {isPast ? (
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted }}>Past</div>
                ) : isBooked ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke={T.sage} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.sage }}>Booked</span>
                    </div>
                    <button
                      onClick={() => handleCancel(s.id, bookedMap[s.id].bookingId)}
                      disabled={inFlight}
                      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', opacity: inFlight ? 0.4 : 1 }}
                    >
                      {inFlight ? '…' : 'Cancel'}
                    </button>
                  </>
                ) : onWaitlist ? (
                  <>
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.sand }}>Waitlisted</div>
                    <button
                      onClick={() => handleLeaveWaitlist(s.id)}
                      disabled={inFlight}
                      style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, color: T.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline', opacity: inFlight ? 0.4 : 1 }}
                    >
                      {inFlight ? '…' : 'Leave'}
                    </button>
                  </>
                ) : isFull ? (
                  <>
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted }}>Full</div>
                    <button
                      onClick={() => handleJoinWaitlist(s.id)}
                      disabled={inFlight}
                      style={{
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: T.brown, background: 'none',
                        border: `1px solid ${T.brown}`, padding: '5px 10px',
                        cursor: 'pointer', opacity: inFlight ? 0.5 : 1,
                      }}
                    >
                      {inFlight ? '…' : 'Waitlist'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleBook(s.id)}
                      disabled={inFlight}
                      style={{
                        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 600,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: T.linen, background: T.esp, border: 'none',
                        padding: '7px 14px', cursor: 'pointer', opacity: inFlight ? 0.5 : 1,
                      }}
                    >
                      {inFlight ? '…' : 'Book'}
                    </button>
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, color: isLow ? T.rust : T.muted, textAlign: 'right' }}>
                      {spots} {isLow ? 'left' : 'spots'}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}

        <div style={{ height: 20 }} />
      </div>
    </div>
  )
}
