'use client'

import { useState } from 'react'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import Link from 'next/link'
import { contact, hours, studio } from '@/lib/content'

export default function ContactPage() {
  const [sent,     setSent]     = useState(false)
  const [sending,  setSending]  = useState(false)
  const [error,    setError]    = useState('')
  const [form,     setForm]     = useState({ name: '', email: '', subject: contact.form.subjects[0], message: '' })

  const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/contact', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Send failed')
      setSent(true)
    } catch {
      setError('Something went wrong. Please try emailing us directly.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── PAGE HERO ── */}
      <div style={{ borderBottom: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '52vh' }}>
        {/* Left dark */}
        <div style={{ background: 'var(--esp)', padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 60%,oklch(0.38 0.06 40 / .4) 0%,transparent 60%)' }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,.35)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '28px', height: '1px', background: 'rgba(196,168,130,.4)', display: 'block' }} />
              {contact.hero.eyebrow}
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(48px,5.5vw,76px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--linen)', letterSpacing: '-.01em', marginBottom: '24px' }}>
              {contact.hero.heading}<br />
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#c4a882' }}>{contact.hero.headingItalic}</em>
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.55)', lineHeight: 1.8, maxWidth: '380px' }}>
              {contact.hero.desc}
            </p>
          </div>
        </div>
        {/* Right linen with details */}
        <div style={{ background: 'var(--l2)', padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div>
            {contact.hero.details.map(({ label, value }) => (
              <div key={label} style={{ padding: '22px 0', borderTop: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '100px 1fr', gap: '16px', alignItems: 'start' }}>
                <span style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: '2px' }}>{label}</span>
                <span style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--text)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{value}</span>
              </div>
            ))}
            <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: '22px' }} />
          </div>
        </div>
      </div>

      {/* ── MAP PLACEHOLDER ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ height: '380px', background: 'var(--l3)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#e0d4c0 0%,#c8b898 50%,#b0a080 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(42,21,6,.04) 40px,rgba(42,21,6,.04) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(42,21,6,.04) 40px,rgba(42,21,6,.04) 41px)' }} />
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--esp)', margin: '0 auto 8px', boxShadow: '0 0 0 6px rgba(42,21,6,.15)' }} />
              <div style={{ background: 'var(--esp)', color: 'var(--linen)', fontSize: '11px', letterSpacing: '.1em', textTransform: 'uppercase', padding: '10px 18px', fontWeight: 400 }}>
                BodyForme Pilates
              </div>
            </div>
          </div>
          {/* Address overlay */}
          <div style={{ position: 'absolute', bottom: '24px', left: '48px', background: 'var(--canvas)', border: '1px solid var(--rule)', padding: '20px 24px', zIndex: 3 }}>
            <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 400, color: 'var(--esp)', marginBottom: '4px' }}>BodyForme Pilates</div>
            <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--mid)', marginBottom: '12px' }}>{studio.address}</div>
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(studio.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brown)', borderBottom: '1px solid var(--brown)', paddingBottom: '2px', textDecoration: 'none', transition: 'opacity .2s' }}
            >
              Get directions →
            </a>
          </div>
        </div>
      </div>

      {/* ── CONTACT FORM + INFO ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px' }}>

            {/* Form */}
            <div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '32px', fontWeight: 400, color: 'var(--esp)', marginBottom: '8px' }}>
                {contact.form.title}
              </h2>
              <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7, marginBottom: '40px' }}>
                {contact.form.subtitle}
              </p>

              {sent ? (
                <div style={{ background: 'var(--l2)', border: '1px solid var(--rule)', padding: '24px 28px' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--esp)', marginBottom: '6px' }}>
                    {contact.form.success.title}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.65 }}>
                    {contact.form.success.body}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                    <div>
                      <label style={lblStyle}>First name</label>
                      <input
                        value={form.name}
                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                        required
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={lblStyle}>Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        required
                        style={inputStyle}
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '28px' }}>
                    <label style={lblStyle}>Subject</label>
                    <select
                      value={form.subject}
                      onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                      style={{ ...inputStyle, appearance: 'none' }}
                    >
                      {contact.form.subjects.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: '28px' }}>
                    <label style={lblStyle}>Message</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                      required
                      rows={5}
                      style={{ ...inputStyle, resize: 'none', height: '100px' }}
                    />
                  </div>
                  {error && <p style={{ fontSize: '12px', color: '#c44', marginBottom: '12px' }}>{error}</p>}
                  <button
                    type="submit"
                    disabled={sending}
                    style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--esp)', padding: '15px 36px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', transition: 'background .2s', marginTop: '8px', display: 'inline-block', opacity: sending ? .6 : 1 }}
                  >
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>

            {/* Info aside */}
            <div style={{ paddingTop: '60px' }}>
              <div style={{ marginBottom: '40px' }}>
                <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--esp)', marginBottom: '20px' }}>Contact details</h3>
                <div>
                  {[
                    { label: 'Address', value: studio.address },
                    { label: 'Phone',   value: studio.phone   },
                    { label: 'Email',   value: studio.email   },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ padding: '16px 0', borderTop: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px' }}>
                      <span style={{ fontSize: '9.5px', letterSpacing: '.13em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: '2px' }}>{label}</span>
                      <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--text)', lineHeight: 1.6 }}>{value}</span>
                    </div>
                  ))}
                  <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: '16px' }} />
                </div>
              </div>

              {/* Social */}
              <div>
                <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--esp)', marginBottom: '20px' }}>Follow us</h3>
                <div>
                  {contact.social.map(s => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderTop: '1px solid var(--rule)', textDecoration: 'none', cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '36px', height: '36px', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--muted)', flexShrink: 0 }}>
                          {s.icon}
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text)' }}>{s.name}</div>
                          <div style={{ fontSize: '11px', fontWeight: 300, color: 'var(--muted)' }}>{s.handle}</div>
                        </div>
                      </div>
                      <span style={{ color: 'var(--muted)', fontSize: '14px' }}>›</span>
                    </a>
                  ))}
                  <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: '16px' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HOURS TABLE ── */}
      <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--l2)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 48px', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px', alignItems: 'start' }}>
          <ScrollReveal>
            <div>
              <div className="slbl">Opening times</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', marginBottom: '16px' }}>
                Studio <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>hours</em>
              </h2>
              <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75, marginTop: '16px' }}>
                Class times may vary. Check the live schedule for today&apos;s sessions.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--rule)' }}>
              <tbody>
                {hours.map((row, i) => {
                  const isToday = i === todayIdx
                  return (
                    <tr
                      key={row.day}
                      style={{ borderBottom: i < hours.length - 1 ? '1px solid var(--rule)' : 'none', background: isToday ? 'var(--canvas)' : 'transparent' }}
                    >
                      <td style={{ padding: '16px 24px', fontSize: '12.5px', fontWeight: isToday ? 500 : 300, color: isToday ? 'var(--esp)' : 'var(--mid)', width: '180px', letterSpacing: '.02em' }}>
                        {row.day}
                        {isToday && (
                          <span style={{ fontSize: '8.5px', letterSpacing: '.12em', textTransform: 'uppercase', background: 'var(--brown)', color: 'var(--canvas)', padding: '2px 7px', marginLeft: '8px', fontWeight: 500, verticalAlign: 'middle' }}>Today</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '13px', fontWeight: isToday ? 500 : 300, color: isToday ? 'var(--esp)' : 'var(--text)' }}>
                        {row.open} – {row.close}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </ScrollReveal>
        </div>
      </div>

      {/* ── TEAM STRIP ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '72px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '48px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(26px,2.8vw,38px)', fontWeight: 400, color: 'var(--esp)', marginBottom: '8px' }}>
              Want to meet the <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>team?</em>
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.65, maxWidth: '420px' }}>
              Read about Suzanne and our instructors, or come in and say hello before your first class.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            <Link
              href="/about"
              style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--esp)', border: '1px solid var(--esp)', padding: '12px 24px', textDecoration: 'none', display: 'inline-block', transition: 'all .2s' }}
            >
              About us
            </Link>
            <Link
              href="/classes"
              style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--esp)', padding: '12px 24px', textDecoration: 'none', display: 'inline-block', transition: 'background .2s' }}
            >
              View classes
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

// ── Style helpers ─────────────────────────────────────────────────────────────

const lblStyle: React.CSSProperties = {
  fontSize: '9.5px',
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'var(--muted)',
  display: 'block',
  marginBottom: '8px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid var(--rule)',
  padding: '8px 0',
  fontFamily: 'var(--font-dm-sans)',
  fontSize: '13.5px',
  fontWeight: 300,
  color: 'var(--text)',
  outline: 'none',
  transition: 'border-color .2s',
}
