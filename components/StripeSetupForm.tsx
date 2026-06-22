'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const BASE = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://bodyforme.com.au'

function InnerForm({ onSuccess, onCancel, dark }: {
  onSuccess: () => void
  onCancel:  () => void
  dark?:     boolean
}) {
  const stripe   = useStripe()
  const elements = useElements()
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const { error: stripeError } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${BASE}/app/setup-payment/success` },
      redirect: 'if_required',
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
    } else {
      onSuccess()
    }
  }

  if (dark) {
    return (
      <form onSubmit={handleSubmit}>
        <PaymentElement options={{ layout: 'tabs', paymentMethodOrder: ['au_becs_debit', 'card', 'link'] }} />
        {error && (
          <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, color: '#c0392b', marginTop: 12, lineHeight: 1.5 }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            type="submit"
            disabled={loading || !stripe}
            style={{
              flex: 1, height: 48,
              background: '#2a1506', color: '#f4ede1', border: 'none',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Saving…' : 'Save payment details'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              height: 48, padding: '0 20px',
              background: 'none', border: '1px solid #d8ccba', color: '#7a4a2a',
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: 11, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement options={{ layout: 'tabs', paymentMethodOrder: ['au_becs_debit', 'card', 'link'] }} />
      {error && <p className="text-[12px] text-red-600 mt-3 leading-relaxed">{error}</p>}
      <div className="flex gap-2 mt-5">
        <button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 h-9 text-[12.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40"
        >
          {loading ? 'Saving…' : 'Save payment details'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 text-[12.5px] border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export function StripeSetupForm({ clientSecret, onSuccess, onCancel, dark }: {
  clientSecret: string
  onSuccess:    () => void
  onCancel:     () => void
  dark?:        boolean
}) {
  const appearance = dark
    ? {
        theme: 'stripe' as const,
        variables: {
          colorPrimary:    '#7a4a2a',
          colorBackground: '#fdfaf6',
          colorText:       '#2a1506',
          fontFamily:      "'Helvetica Neue', Helvetica, Arial, sans-serif",
          borderRadius:    '0px',
        },
      }
    : {
        theme: 'stripe' as const,
        variables: {
          colorPrimary:    '#000000',
          colorBackground: '#ffffff',
          colorText:       '#111111',
          fontFamily:      'ui-sans-serif, system-ui, sans-serif',
          borderRadius:    '8px',
        },
      }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
      <InnerForm onSuccess={onSuccess} onCancel={onCancel} dark={dark} />
    </Elements>
  )
}
