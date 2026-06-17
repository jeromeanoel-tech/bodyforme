'use client'

import { useState } from 'react'

export default function AdminForgotPasswordPage() {
  const [username,  setUsername]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!username) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/auth/forgot-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username }),
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

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-white items-center justify-center mb-4">
            <span className="text-black text-lg font-bold">B</span>
          </div>
          <h1 className="text-white text-xl font-semibold">Reset password</h1>
          <p className="text-neutral-500 text-sm mt-1">A reset link will be sent to info@bodyforme.com.au</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
          {submitted ? (
            <>
              <p className="text-white text-sm font-medium mb-2">Reset link sent</p>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Check <strong className="text-neutral-300">info@bodyforme.com.au</strong> for a reset link. It&apos;s valid for 1 hour.
              </p>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="firstname.lastname"
                  autoComplete="username"
                  required
                  className="w-full h-11 px-3 bg-neutral-950 border border-neutral-800 text-white text-sm rounded-lg outline-none focus:border-white transition-colors placeholder:text-neutral-600"
                />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !username}
                className="w-full h-11 bg-white text-black text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send reset link'}
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
