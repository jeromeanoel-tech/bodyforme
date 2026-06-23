'use client'

import { useState } from 'react'

const T = {
  linen:  '#f4ede1',
  esp:    '#2a1506',
  brown:  '#7a4a2a',
  mid:    '#6b4e36',
  muted:  '#a08568',
  rule:   '#d8ccba',
  canvas: '#fdfaf6',
  rust:   '#9a5a3a',
}

export default function LoginPage() {
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [showPw,     setShowPw]     = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify({ email, password, rememberMe }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); setLoading(false); return }
      window.location.href = data.redirect ?? '/app/schedule'
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width:            '100%',
    background:       'transparent',
    border:           'none',
    borderBottom:     `1px solid ${T.rule}`,
    padding:          '10px 0',
    fontFamily:       "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize:         15,
    fontWeight:       300,
    color:            T.esp,
    outline:          'none',
    WebkitAppearance: 'none',
  }

  return (
    <div style={{
      minHeight:       '100dvh',
      background:      T.linen,
      display:         'flex',
      alignItems:      'center',
      justifyContent:  'center',
      padding:         '40px 20px',
      boxSizing:       'border-box',
    }}>
      {/* Single centred column */}
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <img src="/bodyformeBlogo.png" alt="BodyForme" style={{ height: 62, width: 'auto', display: 'inline-block' }} />
        </div>

        {/* Form card */}
        <div style={{ background: T.canvas, border: `1px solid ${T.rule}`, padding: '36px 28px' }}>
          <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 26, fontWeight: 400, color: T.esp, marginBottom: 6 }}>
            Welcome <em style={{ fontWeight: 300, color: T.brown }}>back</em>
          </div>
          <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13, fontWeight: 300, color: T.muted, marginBottom: 32, lineHeight: 1.5 }}>
            Sign in to book classes and manage your membership.
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 8 }}>Email</label>
              <input type="email" name="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" style={inp} />
            </div>

            <div style={{ marginBottom: 8, position: 'relative' }}>
              <label style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ ...inp, paddingRight: 32 }}
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: T.muted }}>
                  {showPw
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, marginTop: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ width: 14, height: 14, accentColor: T.esp, cursor: 'pointer' }}
                />
                <span style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, fontWeight: 300, color: T.muted }}>Remember me</span>
              </label>
              <a href="/app/forgot-password" style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, fontWeight: 300, color: T.muted, textDecoration: 'none', borderBottom: `1px solid ${T.rule}` }}>Forgot password?</a>
            </div>

            {error && (
              <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fcc', marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 12, color: T.rust, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading || !email || !password} style={{ width: '100%', background: loading ? T.mid : T.esp, color: T.linen, border: 'none', padding: '15px 0', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              {loading && <span style={{ width: 13, height: 13, border: '2px solid rgba(244,237,225,.3)', borderTopColor: T.linen, borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />}
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Sign up link */}
        <p style={{ marginTop: 24, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 1.6 }}>
          Don&apos;t have an account?{' '}
          <a href="/sign-up" style={{ color: T.brown, textDecoration: 'none', borderBottom: `1px solid ${T.brown}` }}>Sign up</a>
        </p>

      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
