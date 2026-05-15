'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPw,   setShowPw]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Login failed'); setLoading(false); return }
      router.push('/app/schedule')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width:       '100%',
    background:  'transparent',
    border:      'none',
    borderBottom: `1px solid ${T.rule}`,
    padding:     '10px 0',
    fontFamily:  "'DM Sans', system-ui, sans-serif",
    fontSize:    15,
    fontWeight:  300,
    color:       T.esp,
    outline:     'none',
    WebkitAppearance: 'none',
  }

  return (
    <div style={{
      minHeight:      '100dvh',
      background:     T.linen,
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '40px 32px',
    }}>

      {/* Wordmark */}
      <div style={{
        fontFamily:    "'Cormorant Garamond', 'Times New Roman', serif",
        fontSize:      36,
        fontWeight:    500,
        letterSpacing: '-0.01em',
        color:         T.esp,
        marginBottom:  48,
      }}>
        Body<em style={{ color: T.brown, fontWeight: 400 }}>forme</em>
      </div>

      {/* Card */}
      <div style={{
        width:      '100%',
        maxWidth:   380,
        background: T.canvas,
        border:     `1px solid ${T.rule}`,
        padding:    '36px 28px',
      }}>
        <div style={{
          fontFamily:    "'Cormorant Garamond', 'Times New Roman', serif",
          fontSize:      26,
          fontWeight:    400,
          color:         T.esp,
          marginBottom:  6,
        }}>
          Welcome <em style={{ fontWeight: 300, color: T.brown }}>back</em>
        </div>
        <div style={{
          fontFamily:   "'DM Sans', system-ui, sans-serif",
          fontSize:     13,
          fontWeight:   300,
          color:        T.muted,
          marginBottom: 32,
          lineHeight:   1.5,
        }}>
          Sign in to book classes and manage your membership.
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div style={{ marginBottom: 24 }}>
            <label style={{
              fontFamily:    "'DM Sans', system-ui, sans-serif",
              fontSize:      9.5,
              fontWeight:    500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         T.muted,
              display:       'block',
              marginBottom:  8,
            }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              style={inp}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 32, position: 'relative' }}>
            <label style={{
              fontFamily:    "'DM Sans', system-ui, sans-serif",
              fontSize:      9.5,
              fontWeight:    500,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color:         T.muted,
              display:       'block',
              marginBottom:  8,
            }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ ...inp, paddingRight: 32 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{
                  position:   'absolute',
                  right:      0,
                  top:        '50%',
                  transform:  'translateY(-50%)',
                  background: 'none',
                  border:     'none',
                  padding:    4,
                  cursor:     'pointer',
                  color:      T.muted,
                }}
              >
                {showPw
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              padding:      '10px 14px',
              background:   '#fff5f5',
              border:       '1px solid #fcc',
              marginBottom: 20,
            }}>
              <p style={{
                margin:     0,
                fontSize:   12,
                color:      T.rust,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            style={{
              width:         '100%',
              background:    loading ? T.mid : T.esp,
              color:         T.linen,
              border:        'none',
              padding:       '15px 0',
              fontFamily:    "'DM Sans', system-ui, sans-serif",
              fontSize:      11,
              fontWeight:    500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              cursor:        loading ? 'not-allowed' : 'pointer',
              transition:    'background .2s',
              display:       'flex',
              alignItems:    'center',
              justifyContent: 'center',
              gap:           10,
            }}
          >
            {loading && (
              <span style={{
                width:            13,
                height:           13,
                border:           '2px solid rgba(244,237,225,.3)',
                borderTopColor:   T.linen,
                borderRadius:     '50%',
                animation:        'spin .8s linear infinite',
                display:          'inline-block',
              }} />
            )}
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>

      <p style={{
        marginTop:  24,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        fontSize:   12,
        color:      T.muted,
        textAlign:  'center',
        lineHeight: 1.6,
      }}>
        Don&apos;t have an account?{' '}
        <a href="/sign-up" style={{ color: T.brown, textDecoration: 'none', borderBottom: `1px solid ${T.brown}` }}>
          Sign up
        </a>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
