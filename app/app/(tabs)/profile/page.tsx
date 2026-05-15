'use client'

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
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: T.esp }}>{label}</div>
        {sub && <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: T.muted, marginTop: 3 }}>{sub}</div>}
      </div>
      <svg width="6" height="11" viewBox="0 0 6 11">
        <path d="M1 1l4 4.5L1 10" stroke={T.muted} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      </svg>
    </div>
  )

  if (href) return <a href={href} style={{ textDecoration: 'none' }}>{inner}</a>
  if (onClick) return <button onClick={onClick} style={{ width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>{inner}</button>
  return inner
}

export default function ProfilePage() {
  const session = useSession()
  const router  = useRouter()
  const initials = `${session.firstName[0] ?? ''}${session.lastName[0] ?? ''}`.toUpperCase()

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/app/login')
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.linen, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        height: 56, padding: '0 20px', borderBottom: `1px solid ${T.rule}`,
        background: T.linen, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', serif", fontSize: 22, fontWeight: 500, color: T.esp }}>
          Body<em style={{ color: T.brown, fontWeight: 400 }}>forme</em>
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', serif", fontSize: 20, fontStyle: 'italic', color: T.esp }}>Profile</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>

        {/* Hero */}
        <div style={{ padding: '32px 24px 24px', textAlign: 'center', borderBottom: `1px solid ${T.rule}` }}>
          <div style={{
            width: 76, height: 76, borderRadius: '50%',
            background: T.l3, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
            fontSize: 28, color: T.brown, fontStyle: 'italic',
          }}>{initials}</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', 'Times New Roman', serif",
            fontSize: 24, fontStyle: 'italic', color: T.esp, marginTop: 14,
          }}>{session.firstName} {session.lastName}</div>
          <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, color: T.muted, marginTop: 4 }}>
            {session.email}
          </div>
          <div style={{
            display: 'inline-block', marginTop: 14,
            padding: '5px 12px', background: T.esp, color: T.sand,
            fontFamily: "'DM Sans', system-ui, sans-serif",
            fontSize: 9, fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>Active member</div>
        </div>

        {/* Account */}
        <div style={{ paddingTop: 24 }}>
          <div style={{ padding: '0 24px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Account</div>
          <div style={{ background: T.canvas, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
            <NavRow label="Personal details" sub="Name, email, phone" />
            <NavRow label="Notifications" sub="Class reminders, billing alerts" last />
          </div>
        </div>

        {/* Studio */}
        <div style={{ paddingTop: 24 }}>
          <div style={{ padding: '0 24px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Studio</div>
          <div style={{ background: T.canvas, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
            <NavRow label="Studio info" sub="Hours, location, parking" href="https://www.bodyforme.com.au/contact" />
            <NavRow label="Refer a friend" sub="2 weeks free for both of you" last />
          </div>
        </div>

        {/* Support */}
        <div style={{ paddingTop: 24 }}>
          <div style={{ padding: '0 24px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10 }}>Support</div>
          <div style={{ background: T.canvas, borderTop: `1px solid ${T.rule}`, borderBottom: `1px solid ${T.rule}` }}>
            <NavRow label="Contact the studio" href="https://www.bodyforme.com.au/contact" />
            <NavRow label="Terms & privacy" href="/terms" />
            <NavRow label="Sign out" onClick={handleSignOut} last />
          </div>
        </div>

        <div style={{
          padding: '32px 24px', textAlign: 'center',
          fontFamily: "'DM Sans', system-ui, sans-serif",
          fontSize: 10, color: T.muted, letterSpacing: '0.04em',
        }}>
          BodyForme · Doncaster, Melbourne<br />v1.0.0
        </div>

      </div>
    </div>
  )
}
