'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  AuBankAccountElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { signupPlans } from '@/lib/content'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Required by Australian banking regulations (BECS DDR service agreement)
const MANDATE_TEXT = `By providing your bank account details and confirming this payment, you agree to this Direct Debit Request and the Direct Debit Request service agreement, and authorise Stripe Payments Australia Pty Ltd ACN 160 180 343 Direct Debit User ID number 507156 ("Stripe") to debit your account through the Bulk Electronic Clearing System (BECS) on behalf of BodyForme for any amounts separately communicated to you. You certify that you are either an account holder or an authorised signatory on the account listed above.`

function InnerForm({
  clientSecret,
  planKey,
  contactName,
  contactEmail,
  onSuccess,
  onCancel,
}: {
  clientSecret: string
  planKey: string
  contactName: string
  contactEmail: string
  onSuccess: () => void
  onCancel: () => void
}) {
  const stripe   = useStripe()
  const elements = useElements()

  const plan = signupPlans[planKey]

  const [accountName, setAccountName] = useState(contactName)
  const [email,       setEmail]       = useState(contactEmail)
  const [error,       setError]       = useState('')
  const [loading,     setLoading]     = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError('')

    const auBankAccount = elements.getElement(AuBankAccountElement)
    if (!auBankAccount) {
      setError('Bank account element not loaded — please refresh and try again.')
      setLoading(false)
      return
    }

    const { error: stripeError, setupIntent } = await stripe.confirmAuBecsDebitSetup(
      clientSecret,
      {
        payment_method: {
          au_becs_debit: auBankAccount,
          billing_details: { name: accountName, email },
        },
      }
    )

    if (stripeError) {
      setError(stripeError.message ?? 'Something went wrong. Please check the BSB and account number.')
      setLoading(false)
      return
    }

    const paymentMethodId = typeof setupIntent?.payment_method === 'string'
      ? setupIntent.payment_method
      : setupIntent?.payment_method?.id

    if (!paymentMethodId) {
      setError('No payment method returned from Stripe. Please try again.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/admin/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: contactEmail, planKey, paymentMethodId }),
    })

    let data: Record<string, string> = {}
    try { data = await res.json() } catch { /* non-JSON */ }

    if (!res.ok) {
      setError(data.error ?? `Server error ${res.status}`)
      setLoading(false)
      return
    }

    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {plan && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-0.5">Plan</p>
          <p className="text-[13.5px] font-semibold text-neutral-900">{plan.name}</p>
          <p className="text-[12px] text-neutral-500">{plan.period}</p>
        </div>
      )}

      <div>
        <label className="block text-[12px] font-medium text-neutral-700 mb-1">Account holder name</label>
        <input
          type="text"
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
          required
          className="w-full h-9 px-3 text-[13px] border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-neutral-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full h-9 px-3 text-[13px] border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/10"
        />
      </div>

      <div>
        <label className="block text-[12px] font-medium text-neutral-700 mb-1">BSB and account number</label>
        <div className="border border-neutral-300 rounded-lg px-3 py-2.5 focus-within:ring-2 focus-within:ring-black/10">
          <AuBankAccountElement
            options={{
              style: {
                base: {
                  fontSize: '13px',
                  color: '#111111',
                  fontFamily: 'ui-sans-serif, system-ui, sans-serif',
                  '::placeholder': { color: '#9ca3af' },
                },
              },
            }}
          />
        </div>
      </div>

      <p className="text-[10.5px] text-neutral-400 leading-relaxed">{MANDATE_TEXT}</p>

      {error && <p className="text-[12px] text-red-600 leading-relaxed">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading || !stripe}
          className="flex-1 h-9 text-[12.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40"
        >
          {loading ? 'Setting up…' : 'Set up direct debit'}
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

export function AdminBecsForm({
  clientSecret,
  planKey,
  contactName,
  contactEmail,
  onSuccess,
  onCancel,
}: {
  clientSecret: string
  planKey: string
  contactName: string
  contactEmail: string
  onSuccess: () => void
  onCancel: () => void
}) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe' as const,
          variables: {
            colorPrimary:    '#000000',
            colorBackground: '#ffffff',
            colorText:       '#111111',
            fontFamily:      'ui-sans-serif, system-ui, sans-serif',
            borderRadius:    '8px',
          },
        },
      }}
    >
      <InnerForm
        clientSecret={clientSecret}
        planKey={planKey}
        contactName={contactName}
        contactEmail={contactEmail}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  )
}
