'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { signupPlans, signupPolicy, studio } from '@/lib/content'

// ── Form fields ───────────────────────────────────────────────────────────────

type FormData = {
  firstName:       string
  lastName:        string
  email:           string
  password:        string
  confirmPassword: string
  phone:           string
  address:         string
  suburb:          string
  state:           string
  postcode:        string
  agreePolicy:     boolean
}

const EMPTY_FORM: FormData = {
  firstName:       '',
  lastName:        '',
  email:           '',
  password:        '',
  confirmPassword: '',
  phone:           '',
  address:         '',
  suburb:          '',
  state:           'VIC',
  postcode:        '',
  agreePolicy:     false,
}

const STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA']

// ── Inner component (uses useSearchParams) ────────────────────────────────────

function SignUpForm() {
  const params  = useSearchParams()
  const planKey = params.get('plan') ?? 'free-trial'
  const plan    = signupPlans[planKey] ?? signupPlans['free-trial']

  const [form,     setForm]    = useState<FormData>(EMPTY_FORM)
  const [errors,   setErrors]  = useState<Partial<Record<keyof FormData, string>>>({})
  const [showPw,   setShowPw]  = useState(false)
  const [loading,  setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const isFree = plan.mode === 'free'

  function set(field: keyof FormData, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.firstName.trim())  errs.firstName   = 'Required'
    if (!form.lastName.trim())   errs.lastName    = 'Required'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required'
    if (form.password.length < 8) errs.password   = 'Password must be at least 8 characters'
    if (form.confirmPassword !== form.password)    errs.confirmPassword = 'Passwords do not match'
    if (!form.phone.trim())      errs.phone       = 'Required'
    if (!form.address.trim())    errs.address     = 'Required'
    if (!form.suburb.trim())     errs.suburb      = 'Required'
    if (!form.postcode.trim())   errs.postcode    = 'Required'
    if (!form.agreePolicy)       errs.agreePolicy = 'You must agree to the policy to continue'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setApiError('')

    try {
      // Create member account first
      const regRes = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName }),
      })
      const regData = await regRes.json()
      if (!regRes.ok) throw new Error(regData.error ?? 'Account creation failed')

      if (isFree) {
        // Free trial — just register, no payment
        const res = await fetch('/api/free-trial-signup', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...form, plan: planKey }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Registration failed')
        window.location.href = '/sign-up/success?type=trial'
      } else {
        // Paid plan — create Stripe Checkout session
        const res = await fetch('/api/checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...form, plan: planKey }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'Checkout failed')
        window.location.href = data.url  // Stripe checkout URL
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── Breadcrumb ── */}
      <div style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)', padding: '14px 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 48px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/memberships" style={{ fontSize: '11px', color: 'var(--muted)', textDecoration: 'none', letterSpacing: '.08em' }}>Memberships</Link>
          <span style={{ fontSize: '11px', color: 'var(--rule)' }}>›</span>
          <span style={{ fontSize: '11px', color: 'var(--text)', letterSpacing: '.08em' }}>Sign up</span>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 48px 96px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '80px', alignItems: 'start' }}>

          {/* ── Left: Plan summary ── */}
          <div style={{ position: 'sticky', top: '100px' }}>
            <div style={{ fontSize: '9.5px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
              You&apos;re signing up for
            </div>

            {/* Plan card */}
            <div style={{ border: '1px solid var(--rule)', padding: '32px' }}>
              <span style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', border: '1px solid var(--rule)', padding: '4px 10px', display: 'inline-block', marginBottom: '20px' }}>
                {plan.tag}
              </span>
              <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '32px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.05, marginBottom: '8px' }}>
                {plan.name}
              </div>
              <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '40px', fontWeight: 300, color: 'var(--brown)', lineHeight: 1, marginBottom: '6px' }}>
                {plan.amount === 0 ? 'Free' : `$${(plan.amount / 100).toFixed(0)}`}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 300, color: 'var(--muted)', marginBottom: '20px' }}>
                {plan.period}
              </div>
              <p style={{ fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7, marginBottom: '24px' }}>
                {plan.description}
              </p>
              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '20px' }}>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {plan.features.map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--blt)', flexShrink: 0, marginTop: '7px' }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Change plan link */}
            <div style={{ marginTop: '20px' }}>
              <Link
                href="/memberships"
                style={{ fontSize: '11px', fontWeight: 400, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--brown)', borderBottom: '1px solid var(--brown)', paddingBottom: '2px', textDecoration: 'none' }}
              >
                ← Change plan
              </Link>
            </div>

            {/* Policy note */}
            <div style={{ marginTop: '24px', padding: '16px', border: '1px solid var(--rule)', background: 'var(--canvas)' }}>
              <p style={{ fontSize: '11.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7, margin: 0 }}>
                {signupPolicy.note}
              </p>
            </div>
          </div>

          {/* ── Right: Registration form ── */}
          <div>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(32px,3.5vw,48px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', marginBottom: '8px' }}>
              {isFree ? 'Register for your' : 'Complete your'}
              {' '}<em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>
                {isFree ? 'free trial' : 'sign-up'}
              </em>
            </h1>
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7, marginBottom: '40px' }}>
              {isFree
                ? 'Fill in your details below. No payment required — we\'ll be in touch to confirm your first class.'
                : `Fill in your details below, then you'll be taken to our secure payment page to complete your ${plan.name.toLowerCase()}.`
              }
            </p>

            <form onSubmit={handleSubmit} noValidate>

              {/* Name row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                <Field label="First name" error={errors.firstName}>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => set('firstName', e.target.value)}
                    autoComplete="given-name"
                    style={inputStyle(!!errors.firstName)}
                  />
                </Field>
                <Field label="Last name" error={errors.lastName}>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => set('lastName', e.target.value)}
                    autoComplete="family-name"
                    style={inputStyle(!!errors.lastName)}
                  />
                </Field>
              </div>

              {/* Email + phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                <Field label="Email address" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    autoComplete="email"
                    style={inputStyle(!!errors.email)}
                  />
                </Field>
                <Field label="Phone number" error={errors.phone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    autoComplete="tel"
                    style={inputStyle(!!errors.phone)}
                  />
                </Field>
              </div>

              {/* Account login */}
              <div style={{ height: '1px', background: 'var(--rule)', margin: '8px 0 28px' }} />
              <div style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
                Create your account
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                <Field label="Password" error={errors.password}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="Min. 8 characters"
                      autoComplete="new-password"
                      style={{ ...inputStyle(!!errors.password), paddingRight: '36px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--muted)' }}
                    >
                      {showPw ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      )}
                    </button>
                  </div>
                </Field>
                <Field label="Confirm password" error={errors.confirmPassword}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                    style={inputStyle(!!errors.confirmPassword)}
                  />
                </Field>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--muted)', marginBottom: '28px', marginTop: '-16px' }}>
                You&apos;ll use this to log in to the BodyForme member app.
              </p>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--rule)', margin: '8px 0 28px' }} />
              <div style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px' }}>
                Home address
              </div>

              {/* Address */}
              <div style={{ marginBottom: '24px' }}>
                <Field label="Street address" error={errors.address}>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => set('address', e.target.value)}
                    placeholder="123 Example Street"
                    autoComplete="street-address"
                    style={inputStyle(!!errors.address)}
                  />
                </Field>
              </div>

              {/* Suburb + state + postcode */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
                <Field label="Suburb" error={errors.suburb}>
                  <input
                    type="text"
                    value={form.suburb}
                    onChange={e => set('suburb', e.target.value)}
                    autoComplete="address-level2"
                    style={inputStyle(!!errors.suburb)}
                  />
                </Field>
                <Field label="State" error={undefined}>
                  <select
                    value={form.state}
                    onChange={e => set('state', e.target.value)}
                    style={{ ...inputStyle(false), appearance: 'none' }}
                  >
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Postcode" error={errors.postcode}>
                  <input
                    type="text"
                    value={form.postcode}
                    onChange={e => set('postcode', e.target.value)}
                    maxLength={4}
                    autoComplete="postal-code"
                    style={inputStyle(!!errors.postcode)}
                  />
                </Field>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'var(--rule)', margin: '8px 0 28px' }} />

              {/* Policy checkbox */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', cursor: 'pointer' }}>
                  <div
                    onClick={() => set('agreePolicy', !form.agreePolicy)}
                    style={{ width: '18px', height: '18px', border: `1px solid ${errors.agreePolicy ? '#c44' : form.agreePolicy ? 'var(--esp)' : 'var(--rule)'}`, background: form.agreePolicy ? 'var(--esp)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px', cursor: 'pointer', transition: 'all .15s' }}
                  >
                    {form.agreePolicy && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="#f4ede1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--text)', lineHeight: 1.6 }}>
                    {signupPolicy.checkboxText}{' '}
                    <Link href={signupPolicy.policyHref} target="_blank" style={{ color: 'var(--brown)', borderBottom: '1px solid var(--brown)', textDecoration: 'none' }}>
                      {signupPolicy.policyLinkText}
                    </Link>
                    {' '}and{' '}
                    <Link href={signupPolicy.cancelHref} target="_blank" style={{ color: 'var(--brown)', borderBottom: '1px solid var(--brown)', textDecoration: 'none' }}>
                      {signupPolicy.cancelLinkText}
                    </Link>
                  </span>
                </label>
                {errors.agreePolicy && (
                  <p style={{ fontSize: '11.5px', color: '#c44', marginTop: '8px', marginLeft: '32px' }}>{errors.agreePolicy}</p>
                )}
              </div>

              {/* API error */}
              {apiError && (
                <div style={{ padding: '14px 16px', background: '#fff5f5', border: '1px solid #fcc', marginBottom: '20px' }}>
                  <p style={{ fontSize: '13px', color: '#c44', margin: 0 }}>{apiError}</p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', fontSize: '11px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: loading ? 'var(--mid)' : 'var(--esp)', padding: '18px 32px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-dm-sans)', transition: 'background .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                {loading ? (
                  <>
                    <span style={{ width: '14px', height: '14px', border: '2px solid rgba(244,237,225,.3)', borderTopColor: 'var(--linen)', borderRadius: '50%', animation: 'spin .8s linear infinite', display: 'inline-block' }} />
                    {isFree ? 'Registering…' : 'Preparing checkout…'}
                  </>
                ) : (
                  isFree ? 'Complete registration' : `Continue to payment — ${plan.period}`
                )}
              </button>

              {!isFree && (
                <p style={{ fontSize: '11px', fontWeight: 300, color: 'var(--muted)', textAlign: 'center', marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span>🔒</span> Secure payment via Stripe. We never store your card details.
                </p>
              )}

            </form>
          </div>
        </div>
      </div>

      <SiteFooter />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: error ? '#c44' : 'var(--muted)', display: 'block', marginBottom: '8px' }}>
        {label}
      </label>
      {children}
      {error && <p style={{ fontSize: '11px', color: '#c44', marginTop: '4px' }}>{error}</p>}
    </div>
  )
}

function inputStyle(hasError: boolean): React.CSSProperties {
  return {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${hasError ? '#c44' : 'var(--rule)'}`,
    padding: '8px 0',
    fontFamily: 'var(--font-dm-sans)',
    fontSize: '13.5px',
    fontWeight: 300,
    color: 'var(--text)',
    outline: 'none',
    transition: 'border-color .2s',
  }
}

// ── Exported page (Suspense wrapper required for useSearchParams) ──────────────

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="site-body" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Loading…</span>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
