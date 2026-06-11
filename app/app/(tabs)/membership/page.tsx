'use client'

import { useState, useEffect } from 'react'
import { useSession } from '@/components/app/SessionProvider'

const T = {
  linen:  '#f4ede1',
  l2:     '#ede4d4',
  esp:    '#2a1506',
  brown:  '#7a4a2a',
  sand:   '#c4a882',
  mid:    '#6b4e36',
  muted:  '#a08568',
  rule:   '#d8ccba',
  canvas: '#fdfaf6',
  rust:   '#9a5a3a',
}

function ActionRow({ icon, label, sub, danger, last, onClick }: {
  icon:     React.ReactNode
  label:    string
  sub?:     string
  danger?:  boolean
  last?:    boolean
  onClick?: () => void
}) {
  const inner = (
    <div style={{
      padding: '16px 20px',
      borderBottom: last ? 'none' : `1px solid ${T.rule}`,
      display: 'flex', alignItems: 'center', gap: 14,
      cursor: onClick ? 'pointer' : 'default',
    }}>
      <div style={{
        width: 32, height: 32, border: `1px solid ${T.rule}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{icon}</svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13, fontWeight: 500, color: danger ? T.rust : T.esp }}>{label}</div>
        {sub && <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
        <path d="M1 1l4 4.5L1 10" stroke={T.muted} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    </div>
  )
  if (onClick) return <button onClick={onClick} style={{ width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>{inner}</button>
  return inner
}

type PauseState = 'idle' | 'open' | 'sending' | 'done'

type MemberStatus = {
  plan:               string | null
  creditBalance:      number
  nextBillingDate:    string | null
  membershipEndDate:  string | null
  status:             string
}

const PACK_PLANS = ['10-Class Pack', '10 Class Pack', '20-Class Pack', '20 Class Pack', '50-Class Pass', '50 Class Pass', '5-Class Pack', '5 Class Pack', 'casual', 'intro-offer', 'Free Trial', 'Casual Drop-in', 'Casual Class']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function planSummary(ms: MemberStatus): { label: string; value: string; sub: string } {
  const plan = ms.plan ?? ''
  const p    = plan.toLowerCase()

  // Weekly recurring DD plans (3/4 per week)
  if (p.includes('3 per week') || p.includes('weekly-3')) {
    if (ms.nextBillingDate) {
      const d    = new Date(ms.nextBillingDate)
      const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000)
      return { label: '3 classes / week', value: fmtDate(ms.nextBillingDate), sub: diff > 0 ? `Next payment in ${diff} day${diff === 1 ? '' : 's'}` : 'Payment due' }
    }
    return { label: '3 classes / week', value: 'Active', sub: 'Direct debit' }
  }
  if (p.includes('4 per week') || p.includes('weekly-4')) {
    if (ms.nextBillingDate) {
      const diff = Math.ceil((new Date(ms.nextBillingDate).getTime() - Date.now()) / 86_400_000)
      return { label: '4 classes / week', value: fmtDate(ms.nextBillingDate), sub: diff > 0 ? `Next payment in ${diff} day${diff === 1 ? '' : 's'}` : 'Payment due' }
    }
    return { label: '4 classes / week', value: 'Active', sub: 'Direct debit' }
  }

  // Unlimited — could be weekly DD or prepaid (3/6/12 month)
  if (p.includes('unlimited')) {
    // Weekly recurring: has a billing date
    if (ms.nextBillingDate) {
      const diff = Math.ceil((new Date(ms.nextBillingDate).getTime() - Date.now()) / 86_400_000)
      return { label: 'Unlimited', value: fmtDate(ms.nextBillingDate), sub: diff > 0 ? `Next payment in ${diff} day${diff === 1 ? '' : 's'}` : 'Payment due' }
    }
    // Prepaid: has an end date
    if (ms.membershipEndDate) {
      const diff = Math.ceil((new Date(ms.membershipEndDate).getTime() - Date.now()) / 86_400_000)
      return { label: 'Unlimited', value: fmtDate(ms.membershipEndDate), sub: diff > 0 ? `Expires in ${diff} day${diff === 1 ? '' : 's'}` : 'Expired — contact studio' }
    }
    return { label: 'Unlimited', value: 'Active', sub: 'Book as many classes as you like' }
  }

  // Class packs / casual
  if (PACK_PLANS.some(pk => p.includes(pk.toLowerCase())) || p.includes('pack') || p.includes('pass') || p === 'casual' || p === 'intro-offer') {
    const left  = ms.creditBalance
    const label = plan === 'casual' ? 'Casual Drop-in' : plan === 'intro-offer' ? 'Intro Pass' : plan
    return {
      label,
      value: `${left} class${left === 1 ? '' : 'es'} left`,
      sub:   left === 0 ? 'All classes used — contact studio' : left <= 2 ? 'Running low' : 'Available to book',
    }
  }

  if (!plan) return { label: 'No plan', value: '—', sub: 'Contact the studio to sign up' }
  return { label: plan, value: 'Active', sub: '' }
}

export default function MembershipPage() {
  const session = useSession()
  const [portalLoading, setPortalLoading] = useState(false)
  const [billingMsg,    setBillingMsg]    = useState<string | null>(null)
  const [memberStatus,  setMemberStatus]  = useState<MemberStatus | null>(null)

  function fetchStatus() {
    fetch('/api/app/membership-status')
      .then(r => r.json())
      .then(setMemberStatus)
      .catch(() => {})
  }

  useEffect(() => {
    // Show message if redirected back from portal with an error/no-account flag
    const params = new URLSearchParams(window.location.search)
    if (params.get('billing') === 'no-account')
      setBillingMsg('No active Stripe subscription found. Contact the studio to link your billing account.')
    if (params.get('billing') === 'error')
      setBillingMsg('Could not open billing portal. Please try again or contact the studio.')

    // Fetch live membership status and poll every 30 seconds
    fetchStatus()
    const interval = setInterval(fetchStatus, 30_000)
    return () => clearInterval(interval)
  }, [])

  function openPortal() {
    setPortalLoading(true)
    window.location.href = '/api/billing/portal'
  }

  const [pauseState,  setPauseState]  = useState<PauseState>('idle')
  const [pauseStart,  setPauseStart]  = useState('')
  const [pauseWeeks,  setPauseWeeks]  = useState(2)
  const [pauseReason, setPauseReason] = useState('')
  const [pauseError,  setPauseError]  = useState('')

  // default start date to next Monday
  const nextMonday = (() => {
    const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); return d.toISOString().slice(0, 10)
  })()

  function openPause() { setPauseState('open'); if (!pauseStart) setPauseStart(nextMonday) }

  async function submitPause() {
    if (!pauseStart) { setPauseError('Please select a start date'); return }
    setPauseState('sending')
    setPauseError('')
    try {
      const res = await fetch('/api/app/pause-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate: pauseStart, weeks: pauseWeeks, reason: pauseReason }),
      })
      if (res.ok) {
        setPauseState('done')
      } else {
        const d = await res.json()
        setPauseError(d.error ?? 'Something went wrong')
        setPauseState('open')
      }
    } catch {
      setPauseError('Network error — please try again')
      setPauseState('open')
    }
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.linen, overflow: 'hidden' }}>

      {/* Pause modal overlay */}
      {(pauseState === 'open' || pauseState === 'sending' || pauseState === 'done') && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(42,21,6,0.55)', zIndex: 50,
          display: 'flex', alignItems: 'flex-end',
        }}>
          <div style={{
            width: '100%', background: T.canvas, borderTop: `1px solid ${T.rule}`,
            padding: '24px 20px 40px',
          }}>
            {pauseState === 'done' ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 26, fontStyle: 'italic', color: T.esp, marginBottom: 10 }}>Request sent</div>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13, color: T.mid, lineHeight: 1.6, marginBottom: 24 }}>
                  We&apos;ll confirm your pause by email within 1 business day.
                </div>
                <button
                  onClick={() => setPauseState('idle')}
                  style={{
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, fontWeight: 500,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    background: T.esp, color: T.linen, border: 'none', padding: '12px 28px', cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 22, fontStyle: 'italic', color: T.esp }}>
                    Pause membership
                  </div>
                  <button
                    onClick={() => { setPauseState('idle'); setPauseError('') }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 20, lineHeight: 1 }}
                    aria-label="Close"
                  >×</button>
                </div>

                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, color: T.mid, marginBottom: 20, lineHeight: 1.7 }}>
                  Pauses are available for 1–4 weeks. Your billing will be held during the pause and resume automatically when it ends.
                </div>

                {/* Start date */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 8 }}>
                    Pause starts
                  </label>
                  <input
                    type="date"
                    value={pauseStart}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={e => setPauseStart(e.target.value)}
                    style={{
                      width: '100%', height: 44, padding: '0 12px', border: `1px solid ${T.rule}`,
                      background: T.linen, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14,
                      color: T.esp, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Duration */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 8 }}>
                    Duration
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4].map(w => (
                      <button
                        key={w}
                        onClick={() => setPauseWeeks(w)}
                        style={{
                          flex: 1, height: 44,
                          background: pauseWeeks === w ? T.esp : T.linen,
                          color: pauseWeeks === w ? T.linen : T.esp,
                          border: `1px solid ${pauseWeeks === w ? T.esp : T.rule}`,
                          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13,
                          cursor: 'pointer',
                        }}
                      >
                        {w}w
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason (optional) */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.muted, display: 'block', marginBottom: 8 }}>
                    Reason <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={pauseReason}
                    onChange={e => setPauseReason(e.target.value)}
                    placeholder="e.g. Holiday, injury recovery…"
                    style={{
                      width: '100%', height: 44, padding: '0 12px', border: `1px solid ${T.rule}`,
                      background: T.linen, fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14,
                      color: T.esp, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {pauseError && (
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, color: T.rust, marginBottom: 14 }}>{pauseError}</div>
                )}

                <button
                  onClick={submitPause}
                  disabled={pauseState === 'sending'}
                  style={{
                    width: '100%', height: 48,
                    background: T.esp, color: T.linen, border: 'none',
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11,
                    fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
                    cursor: pauseState === 'sending' ? 'not-allowed' : 'pointer',
                    opacity: pauseState === 'sending' ? 0.6 : 1,
                  }}
                >
                  {pauseState === 'sending' ? 'Sending request…' : 'Request pause'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        height: 56, padding: '0 20px', borderBottom: `1px solid ${T.rule}`,
        background: T.linen, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <img src="/bodyforme-wordmark.png" alt="BodyForme" style={{ height: 18, width: 'auto' }} />
        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 20, fontStyle: 'italic', color: T.esp }}>Membership</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>

        {/* Dark plan card */}
        <div style={{ margin: '20px 20px 0', background: T.esp, padding: '28px 24px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 6px)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,0.4)',
            }}>Your membership</div>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 34, color: T.linen, marginTop: 8, lineHeight: 1, fontStyle: 'italic' }}>
              {(memberStatus?.plan?.split(' –')[0] || 'Active')} <em style={{ color: T.sand }}>member</em>
            </div>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 13, color: 'rgba(244,237,225,0.65)', marginTop: 10 }}>
              Hi {session.firstName}
            </div>

            {memberStatus && (() => {
              const s = planSummary(memberStatus)
              return (
                <>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '22px 0 18px' }} />
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'rgba(244,237,225,0.4)', marginBottom: 6 }}>
                        {memberStatus.nextBillingDate ? 'Next payment' : memberStatus.membershipEndDate ? 'Expires' : memberStatus.plan ? 'Classes remaining' : 'Membership status'}
                      </div>
                      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 26, fontWeight: 600, color: T.linen, lineHeight: 1 }}>
                        {s.value}
                      </div>
                      {s.sub && (
                        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: 'rgba(244,237,225,0.5)', marginTop: 5 }}>
                          {s.sub}
                        </div>
                      )}
                    </div>
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(244,237,225,0.35)', textAlign: 'right' }}>
                      {s.label}
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* Plan actions */}
        <div style={{ margin: '20px 20px 0' }}>
          <div style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10,
          }}>Plan</div>
          <div style={{ background: T.canvas, border: `1px solid ${T.rule}` }}>
            <ActionRow
              icon={<><path d="M3 8h10M9 4l4 4-4 4" stroke={T.esp} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>}
              label="Change plan"
              sub="Upgrade, downgrade, or switch billing"
              onClick={openPortal}
            />
            <ActionRow
              icon={<><rect x="4" y="3" width="2" height="10" fill={T.esp}/><rect x="10" y="3" width="2" height="10" fill={T.esp}/></>}
              label="Pause membership"
              sub="Hold your billing for 1–4 weeks"
              onClick={openPause}
            />
            <ActionRow
              icon={<><path d="M4 4l8 8M12 4l-8 8" stroke={T.rust} strokeWidth="1.4" strokeLinecap="round"/></>}
              label="Cancel membership"
              danger
              onClick={openPortal}
              last
            />
          </div>
        </div>

        {/* Billing */}
        <div style={{ margin: '24px 20px 0' }}>
          <div style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9.5, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10,
          }}>Billing</div>
          <div style={{ background: T.canvas, border: `1px solid ${T.rule}` }}>
            <ActionRow
              icon={<><rect x="2" y="4" width="12" height="9" stroke={T.esp} strokeWidth="1.2" fill="none"/><path d="M2 7h12M5 10h2" stroke={T.esp} strokeWidth="1.2"/></>}
              label="Payment methods"
              sub="Update card or bank details"
              onClick={openPortal}
            />
            <ActionRow
              icon={<><rect x="3" y="3" width="10" height="10" stroke={T.esp} strokeWidth="1.2" fill="none"/><path d="M5 6h6M5 9h4" stroke={T.esp} strokeWidth="1.2"/></>}
              label="Invoices & receipts"
              sub="Download past invoices"
              onClick={openPortal}
              last
            />
          </div>
          {billingMsg && (
            <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: T.rust, marginTop: 10, lineHeight: 1.6 }}>
              {billingMsg}
            </p>
          )}
          <p style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: T.muted, marginTop: 10, lineHeight: 1.6 }}>
            Billing is managed securely via Stripe. Tap any item above to open your billing portal.
          </p>
        </div>

        {/* Referral */}
        <div style={{
          margin: '20px 20px 0', padding: '16px 18px',
          border: `1px dashed ${T.rule}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, border: `1px solid ${T.brown}`, color: T.brown,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 16, fontStyle: 'italic',
          }}>%</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, fontWeight: 500, color: T.esp }}>Refer a friend, get 2 weeks free</div>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: T.muted, marginTop: 2 }}>Ask at the studio for your referral code</div>
          </div>
        </div>

      </div>
    </div>
  )
}
