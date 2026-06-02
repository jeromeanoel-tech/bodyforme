'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/app/SessionProvider'
import { useRouter } from 'next/navigation'

const T = {
  linen:  '#f4ede1',
  l2:     '#ede4d4',
  l3:     '#e4d8c6',
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

function NavRow({ label, sub, last, onClick, href }: {
  label:    string
  sub?:     string
  last?:    boolean
  onClick?: () => void
  href?:    string
}) {
  const inner = (
    <div style={{
      padding: '16px 20px',
      borderBottom: last ? 'none' : `1px solid ${T.rule}`,
      display: 'flex', alignItems: 'center',
      cursor: (onClick || href) ? 'pointer' : 'default',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13, color: T.esp }}>{label}</div>
        {sub && <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: T.muted, marginTop: 3 }}>{sub}</div>}
      </div>
      <svg width="6" height="11" viewBox="0 0 6 11">
        <path d="M1 1l4 4.5L1 10" stroke={T.muted} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  )
  if (href)    return <a href={href} style={{ textDecoration: 'none' }}>{inner}</a>
  if (onClick) return <button onClick={onClick} style={{ width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>{inner}</button>
  return inner
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(42,21,6,0.45)' }} onClick={onClose} />
      <div style={{ position: 'relative', background: T.canvas, borderRadius: '16px 16px 0 0', padding: '0 0 40px', maxHeight: '90dvh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px', borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 15, fontWeight: 600, color: T.esp }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1, padding: '0 4px' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Input({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, marginBottom: 8 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px', border: `1px solid ${T.rule}`, background: T.linen, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, color: T.esp, outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}

function Toggle({ label, sub, on, onChange }: { label: string; sub?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ padding: '16px 20px', borderBottom: `1px solid ${T.rule}`, display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13, color: T.esp }}>{label}</div>
        {sub && <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: T.muted, marginTop: 3 }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!on)}
        style={{ width: 44, height: 26, borderRadius: 13, background: on ? T.esp : T.rule, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'background 0.2s' }}
      >
        <span style={{ position: 'absolute', top: 3, left: on ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
      </button>
    </div>
  )
}

type Stats = { completed: number; upcoming: number; favourite: string | null }

export default function ProfilePage() {
  const session = useSession()
  const router  = useRouter()
  const initials = `${session.firstName[0] ?? ''}${session.lastName[0] ?? ''}`.toUpperCase()

  const [stats, setStats] = useState<Stats | null>(null)

  // Personal details sheet
  const [showDetails, setShowDetails]   = useState(false)
  const [detailFirst, setDetailFirst]   = useState(session.firstName)
  const [detailLast,  setDetailLast]    = useState(session.lastName)
  const [detailPhone, setDetailPhone]   = useState('')
  const [detailSuburb, setDetailSuburb] = useState('')
  const [detailSaving, setDetailSaving] = useState(false)
  const [detailError,  setDetailError]  = useState('')
  const [detailSaved,  setDetailSaved]  = useState(false)

  // Notifications sheet
  const [showNotifs,   setShowNotifs]   = useState(false)
  const [notifReminders, setNotifReminders] = useState(true)
  const [notifBilling,   setNotifBilling]   = useState(true)
  const [notifPromos,    setNotifPromos]    = useState(false)
  const [notifSaved,     setNotifSaved]     = useState(false)

  useEffect(() => {
    fetch('/api/app/stats').then(r => r.json()).then(setStats).catch(() => {})
    // Pre-fill phone/suburb from DB
    fetch('/api/app/member-record').then(r => r.json()).then(d => {
      if (d.phone)  setDetailPhone(d.phone)
      if (d.suburb) setDetailSuburb(d.suburb)
    }).catch(() => {})
  }, [])

  async function saveDetails() {
    setDetailSaving(true)
    setDetailError('')
    try {
      const res = await fetch('/api/app/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: detailFirst, lastName: detailLast, phone: detailPhone, suburb: detailSuburb }),
      })
      const d = await res.json()
      if (!res.ok) { setDetailError(d.error ?? 'Something went wrong'); return }
      setDetailSaved(true)
      setTimeout(() => { setDetailSaved(false); setShowDetails(false) }, 1200)
    } catch {
      setDetailError('Network error — please try again')
    } finally {
      setDetailSaving(false)
    }
  }

  function saveNotifs() {
    setNotifSaved(true)
    setTimeout(() => { setNotifSaved(false); setShowNotifs(false) }, 1200)
  }

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/app/login')
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.linen, overflow: 'hidden' }}>

      {/* Personal details sheet */}
      {showDetails && (
        <Sheet title="Personal details" onClose={() => setShowDetails(false)}>
          <div style={{ padding: '24px 20px 8px' }}>
            <Input label="First name"  value={detailFirst}  onChange={setDetailFirst} />
            <Input label="Last name"   value={detailLast}   onChange={setDetailLast} />
            <Input label="Phone"       value={detailPhone}  onChange={setDetailPhone}  type="tel" placeholder="04xx xxx xxx" />
            <Input label="Suburb"      value={detailSuburb} onChange={setDetailSuburb} placeholder="e.g. Doncaster" />
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: T.muted, marginBottom: 20, lineHeight: 1.5 }}>
              Email address cannot be changed here. Contact the studio to update your email.
            </div>
            {detailError && <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, color: T.rust, marginBottom: 12 }}>{detailError}</p>}
            <button
              onClick={saveDetails}
              disabled={detailSaving || !detailFirst.trim() || !detailLast.trim()}
              style={{ width: '100%', padding: '14px 0', background: detailSaved ? T.sage : T.esp, color: T.linen, border: 'none', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', opacity: detailSaving ? 0.6 : 1, transition: 'background 0.3s' }}
            >
              {detailSaved ? '✓ Saved' : detailSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </Sheet>
      )}

      {/* Notifications sheet */}
      {showNotifs && (
        <Sheet title="Notifications" onClose={() => setShowNotifs(false)}>
          <div style={{ paddingBottom: 8 }}>
            <Toggle label="Class reminders"  sub="Email 1 hour before your class"  on={notifReminders} onChange={setNotifReminders} />
            <Toggle label="Billing alerts"   sub="Payment confirmations and failures" on={notifBilling}   onChange={setNotifBilling} />
            <Toggle label="Promotions"       sub="News, offers and special events"  on={notifPromos}    onChange={setNotifPromos} />
          </div>
          <div style={{ padding: '0 20px 8px' }}>
            <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: T.muted, marginBottom: 20, lineHeight: 1.5 }}>
              Notifications are sent to <strong>{session.email}</strong>
            </p>
            <button
              onClick={saveNotifs}
              style={{ width: '100%', padding: '14px 0', background: notifSaved ? T.sage : T.esp, color: T.linen, border: 'none', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.3s' }}
            >
              {notifSaved ? '✓ Saved' : 'Save preferences'}
            </button>
          </div>
        </Sheet>
      )}

      {/* Header */}
      <div style={{ height: 56, padding: '0 20px', borderBottom: `1px solid ${T.rule}`, background: T.linen, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <img src="/bodyforme-wordmark.png" alt="BodyForme" style={{ height: 18, width: 'auto' }} />
        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 20, fontStyle: 'italic', color: T.esp }}>Profile</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>

        {/* Hero */}
        <div style={{ padding: '32px 24px 24px', textAlign: 'center', borderBottom: `1px solid ${T.rule}` }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', background: T.l3, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 28, color: T.brown, fontStyle: 'italic' }}>{initials}</div>
          <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 24, fontStyle: 'italic', color: T.esp, marginTop: 14 }}>{session.firstName} {session.lastName}</div>
          <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, color: T.muted, marginTop: 4 }}>{session.email}</div>
          <div style={{ display: 'inline-block', marginTop: 14, padding: '5px 12px', background: T.esp, color: T.sand, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Active member</div>
        </div>

        {/* Activity stats */}
        <div style={{ margin: '20px 20px 0', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', border: `1px solid ${T.rule}` }}>
          {[
            { n: stats?.completed ?? '—', l: 'This year' },
            { n: stats?.upcoming  ?? '—', l: 'Upcoming' },
            { n: stats?.favourite ?? '—', l: 'Favourite' },
          ].map(s => (
            <div key={s.l} style={{ background: T.canvas, padding: '14px 10px', textAlign: 'center', borderRight: `1px solid ${T.rule}` }}>
              <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: typeof s.n === 'string' && s.n.length > 4 ? 13 : 26, fontStyle: typeof s.n === 'string' && s.n.length > 4 ? 'italic' : 'normal', color: T.esp, lineHeight: 1.2 }}>{s.n ?? '—'}</div>
              <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginTop: 6 }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Account */}
        <div style={{ paddingTop: 24 }}>
          <div style={{ padding: '0 24px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Account</div>
          <div style={{ background: T.canvas, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
            <NavRow label="Personal details" sub="Name, email, phone" onClick={() => setShowDetails(true)} />
            <NavRow label="Notifications"    sub="Class reminders, billing alerts" onClick={() => setShowNotifs(true)} last />
          </div>
        </div>

        {/* Studio */}
        <div style={{ paddingTop: 24 }}>
          <div style={{ padding: '0 24px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Studio</div>
          <div style={{ background: T.canvas, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
            <NavRow label="Studio info"   sub="Hours, location, parking" href="/contact" />
            <NavRow label="Refer a friend" sub="Ask at the studio for your referral code" last />
          </div>
        </div>

        {/* Support */}
        <div style={{ paddingTop: 24 }}>
          <div style={{ padding: '0 24px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Support</div>
          <div style={{ background: T.canvas, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
            <NavRow label="Contact the studio" href="/contact" />
            <NavRow label="Terms & privacy" href="/terms" />
            <NavRow label="Sign out" onClick={handleSignOut} last />
          </div>
        </div>

        <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, color: T.muted, letterSpacing: '0.04em' }}>
          <img src="/bodyforme-wordmark.png" alt="BodyForme" style={{ height: 10, width: 'auto', opacity: 0.5 }} /> · Doncaster, Melbourne<br />v1.0.0
        </div>

      </div>
    </div>
  )
}
