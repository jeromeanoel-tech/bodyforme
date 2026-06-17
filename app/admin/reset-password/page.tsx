'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function ResetPasswordForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token') ?? ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  useEffect(() => {
    if (!token) setError('Invalid reset link — please request a new one.')
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password || !confirm) return
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/reset-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); setLoading(false); return }
      setDone(true)
      setTimeout(() => router.push('/admin/login'), 3000)
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-white items-center justify-center mb-4">
            <span className="text-black text-lg font-bold">B</span>
          </div>
          <h1 className="text-white text-xl font-semibold">New password</h1>
          <p className="text-neutral-500 text-sm mt-1">Choose a new password for your account</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          {done ? (
            <>
              <p className="text-white text-sm font-medium mb-2">Password updated</p>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Your password has been reset. Redirecting you to sign in…
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  New password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-white text-sm rounded-lg outline-none focus:border-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Confirm password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-white text-sm rounded-lg outline-none focus:border-white transition-colors"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !password || !confirm || !token}
                className="w-full h-11 bg-white text-black text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Set new password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-neutral-600 text-xs mt-6">
          <a href="/admin/login" className="text-neutral-500 hover:text-neutral-300 transition-colors">
            Back to sign in
          </a>
        </p>
      </div>
    </div>
  )
}

export default function AdminResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
