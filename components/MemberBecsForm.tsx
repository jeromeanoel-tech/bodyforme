'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  AuBankAccountElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const MANDATE_TEXT = `By providing your bank account details and confirming this payment, you agree to this Direct Debit Request and the Direct Debit Request service agreement, and authorise Stripe Payments Australia Pty Ltd ACN 160 180 343 Direct Debit User ID number 507156 ("Stripe") to debit your account through the Bulk Electronic Clearing System (BECS) on behalf of BodyForme for any amounts separately communicated to you. You certify that you are either an account holder or an authorised signatory on the account listed above.`

const T = {
  linen:  '#f4ede1',
  esp:    '#2a1506',
  brown:  '#7a4a2a',
  mid:    '#6b4e36',
  muted:  '#a08568',
  rule:   '#d8ccba',
  canvas: '#fdfaf6',
}

const font = "'Helvetica Neue', Helvetica, Arial, sans-serif"

function InnerForm({
  clientSecret,
  defaultName,
  defaultEmail,
  onSuccess,
  onCancel,
}: {
  clientSecret:  string
  defaultName:   string
  defaultEmail:  string
  onSuccess:     () => void
  onCancel:      () => void
}) {
  const stripe   = useStripe()
  const elements = useElements()

  const [accountName, setAccountName] = useState(defaultName)
  const [email,       setEmail]       = useState(defaultEmail)
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

    const { error: stripeError } = await stripe.confirmAuBecsDebitSetup(clientSecret, {
      payment_method: {
        au_becs_debit: auBankAccount,
        billing_details: { name: accountName, email },
      },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Something went wrong. Please check the BSB and account number.')
      setLoading(false)
      return
    }

    onSuccess()
  }

  const inputStyle: React.CSSProperties = {
    fontFamily: font,
    fontSize: 13,
    color: T.esp,
    background: T.canvas,
    border: `1px solid ${T.rule}`,
    borderRadius: 0,
    padding: '10px 12px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: font,
    fontSize: 10,
    fontWeight: 500,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: T.muted,
    display: 'block',
    marginBottom: 6,
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label style={labelStyle}>Account holder name</label>
        <input
          type="text"
          value={accountName}
          onChange={e => setAccountName(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>BSB and account number</label>
        <div style={{ border: `1px solid ${T.rule}`, padding: '10px 12px', background: T.canvas }}>
          <AuBankAccountElement
            options={{
              style: {
                base: {
                  fontSize: '13px',
                  color: T.esp,
                  fontFamily: font,
                  '::placeholder': { color: T.muted },
                },
              },
            }}
          />
        </div>
      </div>

      <p style={{ fontFamily: font, fontSize: 10, color: T.muted, lineHeight: 1.6, margin: 0 }}>
        {MANDATE_TEXT}
      </p>

      {error && (
        <p style={{ fontFamily: font, fontSize: 12, color: '#c0392b', lineHeight: 1.5, margin: 0 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          type="submit"
          disabled={loading || !stripe}
          style={{
            flex: 1, height: 48,
            background: T.esp, color: T.linen, border: 'none',
            fontFamily: font, fontSize: 11, fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Saving…' : 'Save bank details'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            height: 48, padding: '0 20px',
            background: 'none', border: `1px solid ${T.rule}`, color: T.brown,
            fontFamily: font, fontSize: 11, fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export function MemberBecsForm({
  clientSecret,
  defaultName,
  defaultEmail,
  onSuccess,
  onCancel,
}: {
  clientSecret:  string
  defaultName:   string
  defaultEmail:  string
  onSuccess:     () => void
  onCancel:      () => void
}) {
  return (
    <Elements stripe={stripePromise}>
      <InnerForm
        clientSecret={clientSecret}
        defaultName={defaultName}
        defaultEmail={defaultEmail}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  )
}
