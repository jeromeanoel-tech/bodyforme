'use client'

import { useState } from 'react'

export default function SetupPaymentPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/stripe/create-setup-session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })
    if (res.ok) {
      const { url } = await res.json()
      window.location.href = url
    } else {
      const { error: msg } = await res.json()
      setError(msg ?? 'Something went wrong. Please try again or contact the studio.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f4ede1] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-[#fdfaf6] border border-[#d8ccba] p-10">
        <p className="text-[11px] tracking-[.18em] uppercase text-[#7a4a2a] mb-4">Direct debit setup</p>
        <h1 className="font-serif text-3xl font-medium text-[#2a1506] mb-3 leading-tight">
          Set up your<br /><em>bank debit</em>
        </h1>
        <p className="text-[14px] text-[#6b5240] leading-relaxed mb-8">
          Enter the email address on your BodyForme account and we&apos;ll take you to a secure page to add your BSB and account number.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] tracking-wider uppercase text-[#a08568] mb-1.5">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-11 px-4 text-sm border border-[#d8ccba] bg-white outline-none focus:border-[#2a1506] text-[#2a1506]"
            />
          </div>

          {error && (
            <p className="text-[13px] text-red-700 bg-red-50 border border-red-200 px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-[#2a1506] text-[#f4ede1] text-[11px] tracking-[.14em] uppercase font-medium disabled:opacity-50"
          >
            {loading ? 'Redirecting…' : 'Continue to secure payment setup'}
          </button>
        </form>

        <p className="mt-6 text-[11px] text-[#a08568] leading-relaxed">
          You&apos;ll be taken to a Stripe-hosted page to securely enter your bank details. BodyForme never sees your account number — it&apos;s handled entirely by Stripe.
        </p>
      </div>
    </main>
  )
}
