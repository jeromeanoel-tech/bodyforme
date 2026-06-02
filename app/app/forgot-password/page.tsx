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
}

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Something went wrong')
        setLoading(false)
        return
      }
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width:        '100%',
    background:   'transparent',
    border:       'none',
    borderBottom: `1px solid ${T.rule}`,
    padding:      '10px 0',
    fontFamily:   "'Helvetica Neue', Helvetica, Arial, sans-serif",
    fontSize:     15,
    fontWeight:   300,
    color:        T.esp,
    outline:      'none',
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

      <img src="/bodyformeBlogo.png" alt="BodyForme" style={{ height: 62, width: 'auto', marginBottom: 48 }} />

      <div style={{
        width:      '100%',
        maxWidth:   380,
        background: T.canvas,
        border:     `1px solid ${T.rule}`,
        padding:    '36px 28px',
      }}>
        {submitted ? (
          <>
            <div style={{
              fontFamily:   "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize:     26,
              fontWeight:   400,
              color:        T.esp,
              marginBottom: 12,
            }}>
              Check your <em style={{ fontWeight: 300, color: T.brown }}>inbox</em>
            </div>
            <p style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize:   13,
              fontWeight: 300,
              color:      T.muted,
              lineHeight: 1.6,
              margin:     0,
            }}>
              If that email is registered, we&apos;ve sent a reset link. It&apos;s valid for 1 hour.
            </p>
            <p style={{
              fontFamily:  "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize:    12,
              fontWeight:  300,
              color:       T.muted,
              lineHeight:  1.6,
              marginTop:   20,
              marginBottom: 0,
            }}>
              Didn&apos;t get it? Check your spam folder or{' '}
              <button
                onClick={() => { setSubmitted(false); setEmail('') }}
                style={{ background: 'none', border: 'none', padding: 0, color: T.brown, cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', textDecoration: 'underline' }}
              >
                try again
              </button>.
            </p>
          </>
        ) : (
          <>
            <div style={{
              fontFamily:   "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize:     26,
              fontWeight:   400,
              color:        T.esp,
              marginBottom: 6,
            }}>
              Reset your <em style={{ fontWeight: 300, color: T.brown }}>password</em>
            </div>
            <div style={{
              fontFamily:   "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize:     13,
              fontWeight:   300,
              color:        T.muted,
              marginBottom: 32,
              lineHeight:   1.5,
            }}>
              Enter your email and we&apos;ll send you a reset link.
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 32 }}>
                <label style={{
                  fontFamily:    "'Helvetica Neue', Helvetica, Arial, sans-serif",
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
                    color:      '#9a5a3a',
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                style={{
                  width:          '100%',
                  background:     loading ? T.mid : T.esp,
                  color:          T.linen,
                  border:         'none',
                  padding:        '15px 0',
                  fontFamily:     "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize:       11,
                  fontWeight:     500,
                  letterSpacing:  '0.14em',
                  textTransform:  'uppercase',
                  cursor:         loading ? 'not-allowed' : 'pointer',
                  transition:     'background .2s',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            10,
                }}
              >
                {loading && (
                  <span style={{
                    width:          13,
                    height:         13,
                    border:         '2px solid rgba(244,237,225,.3)',
                    borderTopColor: T.linen,
                    borderRadius:   '50%',
                    animation:      'spin .8s linear infinite',
                    display:        'inline-block',
                  }} />
                )}
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>

      <p style={{
        marginTop:  24,
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize:   12,
        color:      T.muted,
        textAlign:  'center',
      }}>
        <a href="/app/login" style={{ color: T.brown, textDecoration: 'none', borderBottom: `1px solid ${T.brown}` }}>
          Back to sign in
        </a>
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
