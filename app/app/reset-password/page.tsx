'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!token) setError('Invalid reset link — please request a new one.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || !confirm) return
    if (password !== confirm) { setError('Passwords don\'t match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); setLoading(false); return }
      setDone(true)
      setTimeout(() => router.push('/app/login'), 3000)
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
        {done ? (
          <>
            <div style={{
              fontFamily:   "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize:     26,
              fontWeight:   400,
              color:        T.esp,
              marginBottom: 12,
            }}>
              Password <em style={{ fontWeight: 300, color: T.brown }}>updated</em>
            </div>
            <p style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize:   13,
              fontWeight: 300,
              color:      T.muted,
              lineHeight: 1.6,
              margin:     0,
            }}>
              Your password has been reset. Redirecting you to sign in…
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
              New <em style={{ fontWeight: 300, color: T.brown }}>password</em>
            </div>
            <div style={{
              fontFamily:   "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize:     13,
              fontWeight:   300,
              color:        T.muted,
              marginBottom: 32,
              lineHeight:   1.5,
            }}>
              Choose a new password for your account.
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Password */}
              <div style={{ marginBottom: 24, position: 'relative' }}>
                <label style={{
                  fontFamily:    "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontSize:      9.5,
                  fontWeight:    500,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color:         T.muted,
                  display:       'block',
                  marginBottom:  8,
                }}>New password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
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

              {/* Confirm */}
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
                }}>Confirm password</label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
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
                    color:      T.rust,
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password || !confirm || !token}
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
                {loading ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
