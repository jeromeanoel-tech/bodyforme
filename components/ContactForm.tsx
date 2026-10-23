'use client'

import { useState } from 'react'
import { home } from '@/lib/content'

function Field({ label, name, type }: { label: string; name: string; type: string }) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '10px' }}>{label}</label>
      <input name={name} type={type} required style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', padding: '8px 0', fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--text)', outline: 'none' }} />
    </div>
  )
}

export default function ContactForm() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    try {
      const res  = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { setSent(true); form.reset() }
      else        { setError('Something went wrong — please try again.') }
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div style={{ paddingTop: '12px' }}>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 300, color: 'var(--esp)', marginBottom: '12px' }}>Message sent</div>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75 }}>We&apos;ll get back to you within one business day.</p>
    </div>
  )

  return (
    <div style={{ paddingTop: '12px' }}>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 300, color: 'var(--esp)', marginBottom: '12px' }}>
        {home.contactSection.formHeading}
      </div>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 300, color: 'var(--mid)', marginBottom: '32px', lineHeight: 1.75 }}>
        We aim to respond within one business day.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div className="r2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Field label="Name"  name="name"  type="text"  />
          <Field label="Email" name="email" type="email" />
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '10px' }}>Message</label>
          <textarea
            name="message"
            required
            rows={4}
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', padding: '8px 0', fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--text)', outline: 'none', resize: 'none' }}
          />
        </div>
        {error && <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#c0392b', marginBottom: '12px' }}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  )
}
