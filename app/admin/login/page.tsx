'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    })

    setLoading(false)

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      const d = await res.json() as { error?: string }
      setError(d.error ?? 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-white items-center justify-center mb-4">
            <span className="text-black text-lg font-bold">B</span>
          </div>
          <h1 className="text-white text-xl font-semibold">BodyForme Admin</h1>
          <p className="text-neutral-500 text-sm mt-1">Staff access only</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
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
              className="w-full h-11 px-3 bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg outline-none focus:border-white transition-colors placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="w-full h-11 px-3 bg-neutral-900 border border-neutral-800 text-white text-sm rounded-lg outline-none focus:border-white transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm py-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-white text-black text-sm font-semibold rounded-lg hover:bg-neutral-100 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-neutral-600 text-xs mt-6">
          BodyForme · Doncaster
        </p>
      </div>
    </div>
  )
}
