'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Contact, MemberCredential } from '@/lib/db'
import { signupPlans, planKeyByName } from '@/lib/content'

// ── Types ──────────────────────────────────────────────────────────────────────

type SubData = {
  id:               string
  status:           string
  planName:         string
  amount:           number
  interval:         string
  currentPeriodEnd: number
}

type PmData = {
  id:    string
  type:  'au_becs_debit' | 'card' | 'other'
  bsb?:  string
  last4?: string
  brand?: string
}

type StripeStatus = {
  subscription:  SubData | null
  paymentMethod: PmData | null
}

type Accordion = 'start' | 'setupLink' | 'changePlan' | 'changeDate' | 'cancel' | 'invoices' | null

type InvoiceRow = {
  id:          string
  date:        number
  amount:      number
  status:      string
  description: string
  invoiceUrl:  string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtDate(unixTs: number): string {
  const d = new Date(unixTs * 1000)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function fmtAud(cents: number): string {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`
}

const SUBSCRIPTION_PLANS = Object.entries(signupPlans)
  .filter(([, p]) => p.mode === 'subscription')
  .map(([key, p]) => ({ key, name: p.name, period: p.period }))

// ── Badges ─────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = {
    active:             'bg-emerald-50 text-emerald-800',
    trialing:           'bg-emerald-50 text-emerald-700',
    past_due:           'bg-amber-50 text-amber-700',
    unpaid:             'bg-amber-50 text-amber-700',
    incomplete:         'bg-amber-50 text-amber-700',
    canceled:           'bg-neutral-100 text-neutral-500',
    incomplete_expired: 'bg-neutral-100 text-neutral-500',
    paused:             'bg-neutral-100 text-neutral-600',
  }[status] ?? 'bg-neutral-100 text-neutral-500'

  const label = {
    active:             'Active',
    trialing:           'Trial active',
    past_due:           'Payment overdue',
    unpaid:             'Unpaid',
    incomplete:         'Incomplete',
    canceled:           'Cancelled',
    incomplete_expired: 'Expired',
    paused:             'Paused',
  }[status] ?? status

  return (
    <span className={`inline-block text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${s}`}>
      {label}
    </span>
  )
}

// ── Panel ──────────────────────────────────────────────────────────────────────

export function StripeSubscriptionPanel({
  member,
  contact,
  onMemberUpdate,
}: {
  member:          MemberCredential
  contact:         Contact
  onMemberUpdate:  (m: MemberCredential) => void
}) {
  const [status,       setStatus]       = useState<StripeStatus | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [loadError,    setLoadError]    = useState('')

  const [accordion,    setAccordion]    = useState<Accordion>(null)
  const [actionPlan,   setActionPlan]   = useState('')
  const [actionDate,   setActionDate]   = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError,  setActionError]  = useState('')
  const [actionDone,   setActionDone]   = useState('')

  const [setupUrl,     setSetupUrl]     = useState('')
  const [copied,       setCopied]       = useState(false)

  const [invoices,     setInvoices]     = useState<InvoiceRow[] | null>(null)
  const [invLoading,   setInvLoading]   = useState(false)

  const [creatingCustomer, setCreatingCustomer] = useState(false)

  const memberPlanKey = planKeyByName(member.planOverride ?? '')

  const load = useCallback(async () => {
    if (!member.stripeCustomerId) return
    setLoading(true); setLoadError('')
    try {
      const res  = await fetch(`/api/admin/stripe-subscription-status?memberId=${member._id}`)
      const data = await res.json()
      if (res.ok) setStatus(data as StripeStatus)
      else        setLoadError((data as { error?: string }).error ?? 'Failed to load Stripe data')
    } catch {
      setLoadError('Network error loading Stripe data')
    }
    setLoading(false)
  }, [member._id, member.stripeCustomerId])

  useEffect(() => { load() }, [load])

  function openAccordion(key: Accordion) {
    setAccordion(prev => prev === key ? null : key)
    setActionError(''); setActionDone(''); setSetupUrl('')
    if (key !== 'changePlan' && key !== 'start' && key !== 'setupLink') setActionPlan('')
    if (key === 'changeDate') setActionDate(member.nextBillingDate ?? '')
    if (key === 'invoices' && !invoices) loadInvoices()
  }

  // ── Action: Create Stripe customer ─────────────────────────────────────────

  async function createCustomer() {
    setCreatingCustomer(true)
    try {
      const res  = await fetch('/api/admin/create-stripe-customer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member._id }),
      })
      const data = await res.json()
      if (res.ok) {
        onMemberUpdate({ ...member, stripeCustomerId: data.customerId })
      } else {
        setLoadError(data.error ?? 'Failed to create Stripe customer')
      }
    } finally {
      setCreatingCustomer(false)
    }
  }

  // ── Action: Start subscription (member already has bank details on file) ───

  async function startSubscription() {
    if (!actionPlan || !status?.paymentMethod) return
    setActionLoading(true); setActionError('')
    try {
      const res  = await fetch('/api/admin/create-subscription', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:           contact.email,
          planKey:         actionPlan,
          paymentMethodId: status.paymentMethod.id,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error ?? `Server error ${res.status}`); setActionLoading(false); return }
      const plan = signupPlans[actionPlan]
      onMemberUpdate({ ...member, planOverride: plan.name, status: 'active' })
      setActionDone('Subscription started ✓')
      setAccordion(null)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error')
    }
    setActionLoading(false)
  }

  // ── Action: Generate a Stripe Checkout or Portal link for the member ───────

  async function generateSetupLink(mode: 'subscription' | 'portal') {
    setActionLoading(true); setActionError(''); setSetupUrl('')
    try {
      const res  = await fetch('/api/admin/create-setup-link', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member._id,
          mode,
          ...(mode === 'subscription' ? { planKey: actionPlan } : {}),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error ?? `Server error ${res.status}`); setActionLoading(false); return }
      setSetupUrl(data.url)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error')
    }
    setActionLoading(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(setupUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // ── Action: Change plan ─────────────────────────────────────────────────────

  async function changePlan() {
    if (!actionPlan) return
    setActionLoading(true); setActionError('')
    try {
      const res  = await fetch('/api/admin/change-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member._id, newPlanKey: actionPlan }),
      })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error ?? `Server error ${res.status}`); setActionLoading(false); return }
      onMemberUpdate({ ...member, planOverride: data.newPlanName })
      setActionDone(`Plan changed to ${data.newPlanName} ✓`)
      setAccordion(null)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error')
    }
    setActionLoading(false)
  }

  // ── Action: Change billing date ─────────────────────────────────────────────

  async function changeBillingDate() {
    if (!actionDate) return
    setActionLoading(true); setActionError('')
    try {
      const res  = await fetch('/api/admin/change-billing-date', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId: member._id, newDate: actionDate }),
      })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error ?? `Server error ${res.status}`); setActionLoading(false); return }
      onMemberUpdate({ ...member, nextBillingDate: actionDate, membershipEndDate: actionDate })
      setActionDone('Billing date updated ✓')
      setAccordion(null)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error')
    }
    setActionLoading(false)
  }

  // ── Action: Cancel subscription ─────────────────────────────────────────────

  async function cancelSubscription() {
    setActionLoading(true); setActionError('')
    try {
      const res  = await fetch('/api/admin/cancel-subscription', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contact.email }),
      })
      const data = await res.json()
      if (!res.ok) { setActionError(data.error ?? `Server error ${res.status}`); setActionLoading(false); return }
      onMemberUpdate({ ...member, status: 'inactive', planOverride: '' })
      setActionDone('Subscription cancelled ✓')
      setAccordion(null)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Network error')
    }
    setActionLoading(false)
  }

  // ── Action: Load invoices ───────────────────────────────────────────────────

  async function loadInvoices() {
    setInvLoading(true)
    try {
      const res  = await fetch(`/api/admin/invoice-history?memberId=${member._id}`)
      const data = await res.json()
      if (res.ok) setInvoices(data.invoices)
    } finally {
      setInvLoading(false)
    }
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const sub         = status?.subscription
  const pm          = status?.paymentMethod
  const hasActiveSub = sub?.status === 'active' || sub?.status === 'trialing'
  const hasPastDue   = sub?.status === 'past_due' || sub?.status === 'unpaid'
  const hasCancelled = !sub || sub.status === 'canceled' || sub.status === 'incomplete_expired'
  const hasNoPm      = !pm
  const stripeUrl    = member.stripeCustomerId
    ? `https://dashboard.stripe.com/customers/${member.stripeCustomerId}`
    : null

  const minDateStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

  // ── Render: no customer ─────────────────────────────────────────────────────

  if (!member.stripeCustomerId) {
    return (
      <div className="border border-neutral-200 rounded-xl bg-neutral-50 p-4 space-y-3">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Stripe membership</p>
        <p className="text-[12.5px] text-neutral-500">Not connected to Stripe yet. Create a customer record to manage subscriptions.</p>
        <button onClick={createCustomer} disabled={creatingCustomer}
          className="h-8 px-4 text-[12px] font-medium border border-neutral-300 text-neutral-700 rounded-lg hover:border-black hover:text-black transition-colors disabled:opacity-40">
          {creatingCustomer ? 'Creating…' : '+ Create Stripe customer'}
        </button>
        {loadError && <p className="text-[11px] text-red-600">{loadError}</p>}
      </div>
    )
  }

  // ── Render: loading ─────────────────────────────────────────────────────────

  if (loading && !status) {
    return (
      <div className="border border-neutral-200 rounded-xl bg-neutral-50 p-4">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-3">Stripe membership</p>
        <p className="text-[12px] text-neutral-400">Loading Stripe data…</p>
      </div>
    )
  }

  // ── Render: load error ──────────────────────────────────────────────────────

  if (loadError && !status) {
    return (
      <div className="border border-neutral-200 rounded-xl bg-neutral-50 p-4 space-y-2">
        <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Stripe membership</p>
        <p className="text-[12px] text-red-600">{loadError}</p>
        <button onClick={load} className="text-[11.5px] text-neutral-500 underline hover:text-neutral-800">Retry</button>
      </div>
    )
  }

  // ── Render: main panel ──────────────────────────────────────────────────────

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">

      {/* Status card */}
      <div className="bg-neutral-50 px-4 py-3 space-y-2.5">

        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Stripe membership</p>
          {stripeUrl && (
            <a href={stripeUrl} target="_blank" rel="noopener noreferrer"
              className="text-[11px] text-indigo-500 hover:text-indigo-700 font-medium">
              Open in Stripe ↗
            </a>
          )}
        </div>

        {sub ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13.5px] font-semibold text-neutral-900">{sub.planName || member.planOverride || '—'}</p>
                <p className="text-[11.5px] text-neutral-500 mt-0.5">
                  {fmtAud(sub.amount)} / {sub.interval}
                  {sub.currentPeriodEnd ? ` · Next billing ${fmtDate(sub.currentPeriodEnd)}` : ''}
                </p>
              </div>
              <StatusBadge status={sub.status} />
            </div>

            {pm && (
              <div className="text-[11.5px] text-neutral-500">
                {pm.type === 'au_becs_debit'
                  ? `BECS direct debit · BSB ${pm.bsb} · ···${pm.last4}`
                  : pm.type === 'card'
                  ? `${pm.brand?.charAt(0).toUpperCase()}${pm.brand?.slice(1)} card ···${pm.last4}`
                  : 'Payment method on file'}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-neutral-600">
                {pm ? 'Bank details on file — no active subscription' : 'No subscription set up'}
              </p>
              {pm && (
                <p className="text-[11.5px] text-neutral-400 mt-0.5">
                  {pm.type === 'au_becs_debit'
                    ? `BECS ···${pm.last4}`
                    : pm.type === 'card'
                    ? `${pm.brand} ···${pm.last4}`
                    : 'Payment method on file'}
                </p>
              )}
            </div>
            <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
              Inactive
            </span>
          </div>
        )}
      </div>

      {/* Action done banner */}
      {actionDone && (
        <div className="bg-emerald-50 border-t border-emerald-100 px-4 py-2">
          <p className="text-[12px] text-emerald-800 font-medium">{actionDone}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 py-3 bg-white border-t border-neutral-100 flex flex-wrap gap-1.5">

        {/* No subscription + no PM → need member to set up bank details */}
        {hasNoPm && (hasCancelled || !sub) && (
          <button onClick={() => openAccordion('setupLink')}
            className={`h-7 px-3 text-[11.5px] rounded-lg border transition-colors ${accordion === 'setupLink' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-700 hover:border-black hover:text-black'}`}>
            Send setup link to member
          </button>
        )}

        {/* Has PM + no active sub → start subscription */}
        {!hasNoPm && (hasCancelled || !sub) && (
          <button onClick={() => openAccordion('start')}
            className={`h-7 px-3 text-[11.5px] rounded-lg border transition-colors ${accordion === 'start' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-700 hover:border-black hover:text-black'}`}>
            Start subscription
          </button>
        )}

        {/* Active or past_due subscription actions */}
        {(hasActiveSub || hasPastDue) && (
          <>
            {hasActiveSub && (
              <button onClick={() => openAccordion('changePlan')}
                className={`h-7 px-3 text-[11.5px] rounded-lg border transition-colors ${accordion === 'changePlan' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-700 hover:border-black hover:text-black'}`}>
                Change plan
              </button>
            )}
            {hasActiveSub && (
              <button onClick={() => openAccordion('changeDate')}
                className={`h-7 px-3 text-[11.5px] rounded-lg border transition-colors ${accordion === 'changeDate' ? 'bg-black text-white border-black' : 'border-neutral-300 text-neutral-700 hover:border-black hover:text-black'}`}>
                Change billing date
              </button>
            )}
            <button onClick={() => openAccordion('cancel')}
              className={`h-7 px-3 text-[11.5px] rounded-lg border transition-colors ${accordion === 'cancel' ? 'bg-red-700 text-white border-red-700' : 'border-red-200 text-red-600 hover:border-red-400 hover:bg-red-50'}`}>
              Cancel subscription
            </button>
            {/* Send Customer Portal link — member updates their own bank details */}
            <button onClick={() => openAccordion('setupLink')}
              className={`h-7 px-3 text-[11.5px] rounded-lg border transition-colors ${accordion === 'setupLink' && !(!hasNoPm && (hasCancelled || !sub)) ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700'}`}>
              Update bank details link
            </button>
          </>
        )}

        {/* Billing history — always shown if customer exists */}
        <button onClick={() => openAccordion('invoices')}
          className={`h-7 px-3 text-[11.5px] rounded-lg border transition-colors ${accordion === 'invoices' ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-neutral-700'}`}>
          Billing history
        </button>
      </div>

      {/* ── Accordion: Start subscription ───────────────────────────────────── */}
      {accordion === 'start' && (
        <div className="border-t border-neutral-100 px-4 py-3 space-y-3 bg-white">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Start subscription</p>
          <p className="text-[12px] text-neutral-500">
            Bank details already saved for this member. Choose a plan and start their recurring subscription immediately.
          </p>
          <div>
            <label className="block text-[11px] text-neutral-500 font-medium mb-1">Plan</label>
            <select value={actionPlan} onChange={e => setActionPlan(e.target.value)}
              className="w-full h-9 px-3 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:border-black">
              <option value="">Choose a plan…</option>
              {SUBSCRIPTION_PLANS.map(p => (
                <option key={p.key} value={p.key}>{p.name} — {p.period}</option>
              ))}
            </select>
          </div>
          {actionError && <p className="text-[11.5px] text-red-600">{actionError}</p>}
          <div className="flex gap-2">
            <button onClick={startSubscription} disabled={!actionPlan || actionLoading}
              className="h-8 px-4 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40">
              {actionLoading ? 'Starting…' : 'Start subscription'}
            </button>
            <button onClick={() => setAccordion(null)}
              className="h-8 px-4 text-[12px] border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Accordion: Send setup / portal link ─────────────────────────────── */}
      {accordion === 'setupLink' && (
        <div className="border-t border-neutral-100 px-4 py-3 space-y-3 bg-white">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            {hasActiveSub || hasPastDue ? 'Update bank details link' : 'Send setup link to member'}
          </p>

          {hasActiveSub || hasPastDue ? (
            // Customer Portal — member updates their own bank details
            <>
              <p className="text-[12px] text-neutral-500">
                This generates a secure Stripe Customer Portal link. Copy it and send to {contact.firstName} — they will be able to update their own bank details.
              </p>
              {!setupUrl && (
                <button onClick={() => generateSetupLink('portal')} disabled={actionLoading}
                  className="h-8 px-4 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40">
                  {actionLoading ? 'Generating…' : 'Generate link'}
                </button>
              )}
            </>
          ) : (
            // Checkout — member completes BECS setup + starts subscription
            <>
              <p className="text-[12px] text-neutral-500">
                This generates a secure Stripe Checkout link. Send it to {contact.firstName} — they will enter their own bank details and start their subscription. Stripe requires customers to enter their own direct debit details.
              </p>
              <div>
                <label className="block text-[11px] text-neutral-500 font-medium mb-1">Plan</label>
                <select value={actionPlan} onChange={e => setActionPlan(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:border-black">
                  <option value="">Choose a plan…</option>
                  {SUBSCRIPTION_PLANS.map(p => (
                    <option key={p.key} value={p.key}>{p.name} — {p.period}</option>
                  ))}
                </select>
              </div>
              {!setupUrl && (
                <button onClick={() => generateSetupLink('subscription')} disabled={!actionPlan || actionLoading}
                  className="h-8 px-4 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40">
                  {actionLoading ? 'Generating…' : 'Generate link'}
                </button>
              )}
            </>
          )}

          {actionError && <p className="text-[11.5px] text-red-600">{actionError}</p>}

          {setupUrl && (
            <div className="space-y-2">
              <div className="flex gap-2 items-center">
                <input readOnly value={setupUrl}
                  className="flex-1 h-8 px-2 text-[11px] border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-600 font-mono overflow-hidden" />
                <button onClick={copyLink}
                  className="h-8 px-3 text-[11.5px] font-medium border border-neutral-300 text-neutral-700 rounded-lg hover:border-black whitespace-nowrap">
                  {copied ? 'Copied ✓' : 'Copy link'}
                </button>
              </div>
              <p className="text-[10.5px] text-neutral-400">Copy this link and send it to the member via email or WhatsApp. It expires after 24 hours.</p>
            </div>
          )}

          <button onClick={() => { setAccordion(null); setSetupUrl('') }}
            className="text-[11.5px] text-neutral-400 hover:text-neutral-700">
            Close
          </button>
        </div>
      )}

      {/* ── Accordion: Change plan ───────────────────────────────────────────── */}
      {accordion === 'changePlan' && (
        <div className="border-t border-neutral-100 px-4 py-3 space-y-3 bg-white">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Change plan</p>
          <p className="text-[12px] text-neutral-500">
            Changes take effect immediately. No proration — member is not charged or credited for the partial period.
          </p>
          <div>
            <label className="block text-[11px] text-neutral-500 font-medium mb-1">New plan</label>
            <select value={actionPlan} onChange={e => setActionPlan(e.target.value)}
              className="w-full h-9 px-3 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:border-black">
              <option value="">Choose a plan…</option>
              {SUBSCRIPTION_PLANS
                .filter(p => p.key !== memberPlanKey)
                .map(p => (
                  <option key={p.key} value={p.key}>{p.name} — {p.period}</option>
                ))}
            </select>
          </div>
          {actionError && <p className="text-[11.5px] text-red-600">{actionError}</p>}
          <div className="flex gap-2">
            <button onClick={changePlan} disabled={!actionPlan || actionLoading}
              className="h-8 px-4 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40">
              {actionLoading ? 'Changing…' : 'Confirm change'}
            </button>
            <button onClick={() => setAccordion(null)}
              className="h-8 px-4 text-[12px] border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Accordion: Change billing date ──────────────────────────────────── */}
      {accordion === 'changeDate' && (
        <div className="border-t border-neutral-100 px-4 py-3 space-y-3 bg-white">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Change billing date</p>
          <p className="text-[12px] text-neutral-500">
            Pushes the next billing date to the selected date. Stripe places the subscription in a free extension period until then — no charge is issued for the skipped time.
          </p>
          <div>
            <label className="block text-[11px] text-neutral-500 font-medium mb-1">New next billing date</label>
            <input type="date" value={actionDate} onChange={e => setActionDate(e.target.value)} min={minDateStr}
              className="w-full h-9 px-3 text-[13px] border border-neutral-200 rounded-lg focus:outline-none focus:border-black" />
          </div>
          {actionError && <p className="text-[11.5px] text-red-600">{actionError}</p>}
          <div className="flex gap-2">
            <button onClick={changeBillingDate} disabled={!actionDate || actionLoading}
              className="h-8 px-4 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40">
              {actionLoading ? 'Updating…' : 'Confirm date'}
            </button>
            <button onClick={() => setAccordion(null)}
              className="h-8 px-4 text-[12px] border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Accordion: Cancel ────────────────────────────────────────────────── */}
      {accordion === 'cancel' && (
        <div className="border-t border-neutral-100 px-4 py-3 space-y-3 bg-white">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Cancel subscription</p>
          <p className="text-[12px] text-neutral-700">
            Cancel {sub?.planName || member.planOverride} for {contact.firstName} {contact.lastName}?
            The Stripe subscription will be cancelled immediately and the member will be marked inactive.
          </p>
          {actionError && <p className="text-[11.5px] text-red-600">{actionError}</p>}
          <div className="flex gap-2">
            <button onClick={cancelSubscription} disabled={actionLoading}
              className="h-8 px-4 text-[12px] font-medium bg-red-700 text-white rounded-lg hover:bg-red-800 disabled:opacity-40">
              {actionLoading ? 'Cancelling…' : 'Yes, cancel subscription'}
            </button>
            <button onClick={() => setAccordion(null)}
              className="h-8 px-4 text-[12px] border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400">
              Keep active
            </button>
          </div>
        </div>
      )}

      {/* ── Accordion: Billing history ───────────────────────────────────────── */}
      {accordion === 'invoices' && (
        <div className="border-t border-neutral-100 px-4 py-3 space-y-2 bg-white">
          <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Billing history</p>
          {invLoading && <p className="text-[12px] text-neutral-400">Loading…</p>}
          {!invLoading && invoices && invoices.length === 0 && (
            <p className="text-[12px] text-neutral-400">No invoices found.</p>
          )}
          {!invLoading && invoices && invoices.length > 0 && (
            <div className="divide-y divide-neutral-100">
              {invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-[12.5px] font-medium text-neutral-800">{fmtAud(inv.amount)}</p>
                    <p className="text-[11px] text-neutral-400">{fmtDate(inv.date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${
                      inv.status === 'paid'           ? 'bg-emerald-50 text-emerald-700' :
                      inv.status === 'open'           ? 'bg-amber-50 text-amber-700' :
                      inv.status === 'uncollectible'  ? 'bg-red-50 text-red-700' :
                      'bg-neutral-100 text-neutral-500'
                    }`}>
                      {inv.status === 'paid' ? 'Paid' : inv.status === 'open' ? 'Pending' : inv.status === 'uncollectible' ? 'Overdue' : inv.status}
                    </span>
                    {inv.invoiceUrl && (
                      <a href={inv.invoiceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-indigo-500 hover:text-indigo-700">
                        View ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => setAccordion(null)}
            className="text-[11.5px] text-neutral-400 hover:text-neutral-700 pt-1">
            Close
          </button>
        </div>
      )}
    </div>
  )
}
