'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/app/SessionProvider'
import type { ContactBooking } from '@/lib/db'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import { usePersistedState } from '@/hooks/usePersistedState'

function CalendarStrip({ memberId }: { memberId: string }) {
  const [open,   setOpen]   = useState(false)
  const [copied, setCopied] = useState(false)

  const base    = typeof window !== 'undefined' ? window.location.origin : 'https://bodyforme.com.au'
  const feedUrl = `${base}/api/app/calendar/${memberId}`
  const webcal  = feedUrl.replace(/^https?/, 'webcal')

  function copyUrl() {
    navigator.clipboard.writeText(feedUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={{ margin: '12px 20px 0', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', padding: '10px 14px',
          background: 'transparent', border: `1px solid ${T.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.mid }}>
          Add classes to your calendar
        </span>
        <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 16, color: T.muted, transform: open ? 'rotate(45deg)' : 'none', display: 'inline-block', transition: 'transform .2s' }}>+</span>
      </button>

      {open && (
        <div style={{ border: `1px solid ${T.rule}`, borderTop: 'none', padding: '16px 14px', background: T.canvas, display: 'flex', flexDirection: 'column', gap: 12 }}>

          <div>
            <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, margin: '0 0 6px' }}>Apple Calendar</p>
            <a
              href={webcal}
              style={{
                display: 'block', textAlign: 'center', padding: '11px',
                background: T.esp, color: T.linen,
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Subscribe — Apple Calendar
            </a>
          </div>

          <div>
            <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, margin: '0 0 6px' }}>Google Calendar</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{
                flex: 1, padding: '9px 10px', border: `1px solid ${T.rule}`, background: T.linen,
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, color: T.mid,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {feedUrl}
              </div>
              <button
                onClick={copyUrl}
                style={{
                  padding: '9px 14px', background: copied ? T.sage : T.esp, color: T.linen,
                  border: 'none', cursor: 'pointer',
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase',
                  flexShrink: 0, transition: 'background .2s',
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <a
              href="https://calendar.google.com/calendar/r/settings/addbyurl"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', textAlign: 'center', padding: '11px',
                border: `1px solid ${T.esp}`, color: T.esp,
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              Open Google Calendar → paste URL
            </a>
          </div>

          <a
            href={`${feedUrl}?download=1`}
            style={{
              display: 'block', textAlign: 'center', padding: '10px',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 10, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: T.muted, textDecoration: 'none',
            }}
          >
            Download .ics (one-off import)
          </a>

          <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, color: T.muted, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
            Subscribing keeps your calendar updated as you book or cancel.
          </p>
        </div>
      )}
    </div>
  )
}

const T = {
  linen:  '#f4ede1',
  l2:     '#ede4d4',
  esp:    '#2a1506',
  brown:  '#7a4a2a',
  mid:    '#6b4e36',
  muted:  '#a08568',
  rule:   '#d8ccba',
  canvas: '#fdfaf6',
  sage:   '#7a9478',
}

// Read date directly from ISO string — avoids timezone shift for naive times
function fmt(iso: string) {
  if (!iso) return ''
  const datePart = iso.slice(0, 10) // 'YYYY-MM-DD' — no timezone conversion
  const d = new Date(datePart + 'T12:00:00')
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function fmtTime(iso: string) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleTimeString('en-AU', {
      timeZone: 'Australia/Melbourne',
      hour:     'numeric',
      minute:   '2-digit',
      hour12:   true,
    })
  } catch { return '' }
}

function SkeletonBookingCard() {
  return (
    <div className="skeleton-pulse" style={{
      background: T.canvas, border: `1px solid ${T.rule}`,
      padding: '16px', marginBottom: 10, display: 'flex', gap: 14,
    }}>
      <div style={{ width: 52, flexShrink: 0, borderRight: `1px solid ${T.rule}`, paddingRight: 12 }}>
        <div style={{ width: 28, height: 10, background: T.rule, borderRadius: 3, marginBottom: 6 }} />
        <div style={{ width: 36, height: 28, background: T.l2, borderRadius: 3, marginBottom: 6 }} />
        <div style={{ width: 32, height: 10, background: T.rule, borderRadius: 3 }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ width: '70%', height: 18, background: T.l2, borderRadius: 3, marginBottom: 10 }} />
        <div style={{ width: 56, height: 10, background: T.rule, borderRadius: 3 }} />
      </div>
    </div>
  )
}

export default function BookingsPage() {
  const session  = useSession()
  const [bookings, setBookings] = useState<ContactBooking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = usePersistedState<'upcoming' | 'past'>('bookings-tab', 'upcoming')

  useEffect(() => {
    if (!session.id) { setLoading(false); return }
    fetch(`/api/admin/contact-bookings?contactId=${session.id}`)
      .then(r => r.json())
      .then(d => { setBookings(d.bookings ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session.id])

  // Live: mark sessions as cancelled when admin cancels them
  useEffect(() => {
    const sbr = getBrowserSupabase()
    const channel = sbr
      .channel('schedule-updates-bookings')
      .on('broadcast', { event: 'session-cancelled' }, ({ payload }) => {
        const { sessionId } = payload as { sessionId: string }
        setBookings(bs => bs.map(b =>
          b.sessionId === sessionId && b.status !== 'CANCELLED' ? { ...b, status: 'CANCELLED' } : b
        ))
      })
      .subscribe()
    return () => { sbr.removeChannel(channel) }
  }, [])

  const now      = new Date()
  const upcoming = bookings.filter(b => b.status !== 'CANCELLED' && new Date(b.start + '+00:00') >= now)
  const past     = bookings.filter(b => b.status === 'CANCELLED' || new Date(b.start + '+00:00') < now)
  const shown    = tab === 'upcoming' ? upcoming : past

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.linen, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        height: 56, padding: '0 20px', borderBottom: `1px solid ${T.rule}`,
        background: T.linen, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <img src="/bodyforme-wordmark.png" alt="BodyForme" style={{ height: 18, width: 'auto' }} />
        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 20, fontStyle: 'italic', color: T.esp }}>Bookings</div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', margin: '20px 20px 0', border: `1px solid ${T.rule}`, flexShrink: 0 }}>
        {[
          { n: upcoming.length, l: 'Upcoming' },
          { n: past.filter(b => b.status !== 'CANCELLED').length, l: 'Completed' },
          { n: bookings.length, l: 'Total' },
        ].map(s => (
          <div key={s.l} style={{
            background: T.canvas, padding: '14px 10px', textAlign: 'center',
            borderRight: `1px solid ${T.rule}`,
          }}>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 26, color: T.esp, lineHeight: 1 }}>{loading ? '…' : s.n}</div>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginTop: 6 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Add to calendar */}
      {session.id && <CalendarStrip memberId={session.id} />}

      {/* Tab toggle */}
      <div style={{ display: 'flex', padding: '16px 20px 0', gap: 24, borderBottom: `1px solid ${T.rule}`, marginTop: 16, flexShrink: 0 }}>
        {(['upcoming', 'past'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            paddingBottom: 12,
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 11, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
            color: tab === t ? T.esp : T.muted,
            background: 'none', border: 'none',
            borderBottomColor: tab === t ? T.brown : 'transparent',
            borderBottomWidth: 2,
            borderBottomStyle: 'solid',
            marginBottom: -1, cursor: 'pointer',
          }}>{t === 'upcoming' ? `Upcoming · ${upcoming.length}` : 'Past'}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', background: T.linen }}>

        {/* Skeleton while loading */}
        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonBookingCard key={i} />)}

        {!loading && shown.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 22, fontStyle: 'italic', color: T.mid }}>
              {tab === 'upcoming' ? 'No upcoming bookings' : 'No past classes yet'}
            </div>
            {tab === 'upcoming' && (
              <a href="/app/schedule" style={{ display: 'inline-block', marginTop: 16, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.brown, textDecoration: 'none', borderBottom: `1px solid ${T.brown}`, paddingBottom: 2 }}>
                Browse schedule →
              </a>
            )}
          </div>
        )}

        {shown.map(b => {
          const startDate = new Date(b.start + '+00:00')
          const isPast    = startDate < now || b.status === 'CANCELLED'
          const statusLabel = b.status === 'CANCELLED'
            ? 'Cancelled'
            : isPast
              ? b.attended ? '✓ Attended' : 'Not attended'
              : 'Booked'
          const statusColor = b.status === 'CANCELLED'
            ? T.muted
            : isPast
              ? b.attended ? T.sage : T.muted
              : T.brown
          const parts = fmt(b.start).split(' ')  // ['Mon', '22', 'Jun']
          return (
            <div key={b.id} style={{
              background: isPast ? 'transparent' : T.canvas,
              border: `1px solid ${T.rule}`,
              padding: '16px',
              marginBottom: 10,
              display: 'flex',
              gap: 14,
              opacity: isPast ? 0.7 : 1,
            }}>
              {/* Date */}
              <div style={{
                width: 52, flexShrink: 0,
                borderRight: `1px solid ${T.rule}`, paddingRight: 12,
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
              }}>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 8.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted }}>
                  {parts[0]}
                </div>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 28, lineHeight: 1, color: T.esp, marginTop: 1 }}>
                  {parts[1]}
                </div>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, color: T.muted, marginTop: 3 }}>
                  {fmtTime(b.start)}
                </div>
              </div>

              {/* Class */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 18, fontStyle: 'italic', color: T.esp }}>{b.title}</div>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: statusColor, marginTop: 8 }}>
                  {statusLabel}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
