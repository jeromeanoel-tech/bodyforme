'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/app/SessionProvider'
import type { WixContactBooking } from '@/lib/db'

function CalendarStrip({ memberId }: { memberId: string }) {
  const [open, setOpen] = useState(false)
  const base    = typeof window !== 'undefined' ? window.location.origin : 'https://bodyforme.com.au'
  const feedUrl = `${base}/api/app/calendar/${memberId}`
  const webcal  = feedUrl.replace(/^https?/, 'webcal')
  const googleUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`

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
        <div style={{ border: `1px solid ${T.rule}`, borderTop: 'none', padding: '16px 14px', background: T.canvas, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Apple Calendar */}
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

          {/* Google Calendar */}
          <a
            href={googleUrl}
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
            Subscribe — Google Calendar
          </a>

          {/* Download one-off */}
          <a
            href={`${feedUrl}?download=1`}
            style={{
              display: 'block', textAlign: 'center', padding: '10px',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 10, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: T.muted, textDecoration: 'none', borderBottom: `1px solid ${T.rule}`, paddingBottom: 2,
              alignSelf: 'center',
            }}
          >
            Download .ics (one-off)
          </a>

          <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, color: T.muted, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
            Subscribe keeps your calendar updated automatically as you book or cancel classes.
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

function fmt(iso: string) {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  } catch { return iso }
}

function fmtTime(iso: string) {
  if (!iso) return ''
  try {
    const [, time] = iso.split('T')
    if (!time) return ''
    const [h, m] = time.split(':').map(Number)
    const ampm   = h < 12 ? 'am' : 'pm'
    const h12    = h % 12 || 12
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
  } catch { return '' }
}

export default function BookingsPage() {
  const session = useSession()
  const [bookings, setBookings] = useState<WixContactBooking[]>([])
  const [loading,  setLoading]  = useState(true)
  const [tab,      setTab]      = useState<'upcoming' | 'past'>('upcoming')

  useEffect(() => {
    if (!session.id) { setLoading(false); return }
    fetch(`/api/admin/contact-bookings?contactId=${session.id}`)
      .then(r => r.json())
      .then(d => { setBookings(d.bookings ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session.id])

  const now       = new Date()
  const upcoming  = bookings.filter(b => b.status !== 'CANCELED' && new Date(b.start) >= now)
  const past      = bookings.filter(b => b.status === 'CANCELED' || new Date(b.start) < now)
  const shown     = tab === 'upcoming' ? upcoming : past

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
          { n: past.filter(b => b.status !== 'CANCELED').length, l: 'Completed' },
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
            borderBottom: tab === t ? `2px solid ${T.brown}` : '2px solid transparent',
            marginBottom: -1, background: 'none', border: 'none',
            borderBottomColor: tab === t ? T.brown : 'transparent',
            borderBottomWidth: 2,
            borderBottomStyle: 'solid',
            cursor: 'pointer',
          }}>{t === 'upcoming' ? `Upcoming · ${upcoming.length}` : 'Past'}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px 20px', background: T.linen }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13, color: T.muted }}>Loading…</div>
        )}

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
          const isPast = new Date(b.start) < now || b.status === 'CANCELED'
          const statusLabel = b.status === 'CANCELED'
            ? 'Cancelled'
            : isPast
              ? b.attended ? '✓ Attended' : 'Not attended'
              : 'Booked'
          const statusColor = b.status === 'CANCELED'
            ? T.muted
            : isPast
              ? b.attended ? T.sage : T.muted
              : T.brown
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
                  {fmt(b.start).split(' ')[0]}
                </div>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 28, lineHeight: 1, color: T.esp, marginTop: 1 }}>
                  {fmt(b.start).split(' ')[1]}
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
