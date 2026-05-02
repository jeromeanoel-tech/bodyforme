'use client'

import { useState, useEffect } from 'react'

type Tab     = 'send' | 'automations'
type Segment = 'all' | 'active-members' | 'expiring-soon' | 'new-this-month' | 'no-membership'
type SendState = 'idle' | 'previewing' | 'sending' | 'done' | 'error'

const SEGMENTS: { value: Segment; label: string; description: string }[] = [
  { value: 'active-members', label: 'Active members',      description: 'Everyone with a current active membership' },
  { value: 'expiring-soon',  label: 'Expiring soon',       description: 'Active members whose membership expires within 14 days' },
  { value: 'new-this-month', label: 'New this month',      description: 'Clients who joined in the last 30 days' },
  { value: 'no-membership',  label: 'No membership',       description: 'Contacts without any membership order' },
  { value: 'all',            label: 'All contacts',        description: 'Everyone in your contact list with an email address' },
]

const AUTOMATIONS = [
  {
    title:     'Google review request',
    trigger:   'First class attended + 7 days',
    template:  'review-request',
    desc:      'Sent automatically after a new client attends their first session. Asks for a Google review.',
    active:    true,
  },
  {
    title:     '30-day re-engagement',
    trigger:   'No bookings in 30 days',
    template:  'reengagement-30',
    desc:      'Sent when a client hasn\'t booked in a month. Gently nudges them back.',
    active:    true,
  },
  {
    title:     '90-day re-engagement',
    trigger:   'No bookings in 90 days',
    template:  'reengagement-90',
    desc:      'Sent when a client has been inactive for 3 months. More direct re-engagement.',
    active:    true,
  },
  {
    title:     'Payment failed alert',
    trigger:   'Stripe invoice.payment_failed',
    template:  'payment-failed',
    desc:      'Sent automatically via Stripe webhook when a recurring membership payment fails.',
    active:    true,
  },
]

export default function MarketingClient() {
  const [tab, setTab]           = useState<Tab>('send')
  const [segment, setSegment]   = useState<Segment>('active-members')
  const [subject, setSubject]   = useState('')
  const [body, setBody]         = useState('')
  const [count, setCount]       = useState<number | null>(null)
  const [sendState, setSendState] = useState<SendState>('idle')
  const [result, setResult]     = useState<{ sent: number; failed: number } | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    setCount(null)
    setSendState('idle')
    setResult(null)
    fetch(`/api/admin/broadcast?segment=${segment}`)
      .then(r => r.json())
      .then(d => setCount(d.count ?? null))
      .catch(() => setCount(null))
  }, [segment])

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    setSendState('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ segment, subject: subject.trim(), body: body.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorMsg(data.error ?? 'Send failed'); setSendState('error'); return }
      setResult({ sent: data.sent, failed: data.failed })
      setSendState('done')
    } catch (e) {
      setErrorMsg(String(e))
      setSendState('error')
    }
  }

  function reset() {
    setSendState('idle')
    setResult(null)
    setErrorMsg('')
    setSubject('')
    setBody('')
  }

  const canSend = subject.trim().length > 0 && body.trim().length > 0 && count !== null && count > 0

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* Tabs */}
      <div className="shrink-0 flex border-b border-neutral-200 bg-white px-6">
        {([['send', 'Send email'], ['automations', 'Automations']] as [Tab, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`py-3.5 mr-6 text-[13px] border-b-2 transition-colors ${
              tab === key
                ? 'border-black text-neutral-900 font-medium'
                : 'border-transparent text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto bg-neutral-50">
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

          {/* ── Send email tab ── */}
          {tab === 'send' && (
            <>
              {sendState === 'done' && result ? (
                <div className="bg-white border border-neutral-200 rounded-xl px-6 py-10 text-center space-y-3">
                  <p className="text-3xl font-semibold text-neutral-900">{result.sent}</p>
                  <p className="text-sm text-neutral-500">
                    email{result.sent !== 1 ? 's' : ''} sent successfully
                    {result.failed > 0 && ` · ${result.failed} failed`}
                  </p>
                  <button
                    onClick={reset}
                    className="mt-2 h-8 px-4 text-sm border border-neutral-200 rounded-lg text-neutral-600 hover:border-black hover:text-black transition-colors"
                  >
                    Send another
                  </button>
                </div>
              ) : (
                <>
                  {/* Segment picker */}
                  <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <h3 className="text-[13px] font-semibold text-neutral-900">Audience</h3>
                      <p className="text-[11.5px] text-neutral-400 mt-0.5">Who receives this email</p>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {SEGMENTS.map(s => (
                        <label key={s.value} className="flex items-start gap-3 px-5 py-3.5 cursor-pointer hover:bg-neutral-50 transition-colors">
                          <input
                            type="radio"
                            name="segment"
                            value={s.value}
                            checked={segment === s.value}
                            onChange={() => setSegment(s.value)}
                            className="mt-0.5 accent-black shrink-0"
                          />
                          <div className="flex-1">
                            <p className="text-[13px] font-medium text-neutral-800">{s.label}</p>
                            <p className="text-[11.5px] text-neutral-400 mt-0.5">{s.description}</p>
                          </div>
                          {segment === s.value && (
                            <span className="text-[12px] font-semibold text-neutral-500 shrink-0 pt-0.5">
                              {count === null ? '…' : `${count} recipient${count !== 1 ? 's' : ''}`}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Compose */}
                  <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-100">
                      <h3 className="text-[13px] font-semibold text-neutral-900">Compose</h3>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          placeholder="e.g. A special offer for our members"
                          className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                          Message
                        </label>
                        <textarea
                          value={body}
                          onChange={e => setBody(e.target.value)}
                          placeholder={"Write your message here.\n\nThe recipient's first name will be used in the greeting automatically."}
                          rows={8}
                          className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black resize-none"
                        />
                        <p className="text-[11px] text-neutral-400 mt-1">
                          Plain text. Starts with "Hi [first name]," automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Send bar */}
                  <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4 flex items-center justify-between">
                    <div>
                      {count !== null && count > 0 ? (
                        <p className="text-[13px] text-neutral-700">
                          Sending to <span className="font-semibold">{count} recipient{count !== 1 ? 's' : ''}</span>
                        </p>
                      ) : count === 0 ? (
                        <p className="text-[13px] text-neutral-400">No recipients in this segment</p>
                      ) : (
                        <p className="text-[13px] text-neutral-400">Loading recipient count…</p>
                      )}
                      {count !== null && count > 90 && (
                        <p className="text-[11.5px] text-neutral-400 mt-0.5">
                          Resend free tier allows 100 emails/day — consider splitting large sends.
                        </p>
                      )}
                      {sendState === 'error' && (
                        <p className="text-[12px] text-red-500 mt-0.5">{errorMsg}</p>
                      )}
                    </div>
                    <button
                      onClick={handleSend}
                      disabled={!canSend || sendState === 'sending'}
                      className="h-9 px-5 text-[13px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40 shrink-0"
                    >
                      {sendState === 'sending' ? 'Sending…' : 'Send email'}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Automations tab ── */}
          {tab === 'automations' && (
            <>
              <div>
                <p className="text-[13px] text-neutral-500">
                  These emails fire automatically based on triggers. They run via Wix Automations → webhook → this app → Resend.
                </p>
              </div>

              {AUTOMATIONS.map(a => (
                <div key={a.title} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="px-5 py-4 flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-[13.5px] font-semibold text-neutral-900">{a.title}</h3>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black text-white">Active</span>
                      </div>
                      <p className="text-[12px] text-neutral-500 mb-2">{a.desc}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Trigger:</span>
                        <span className="text-[12px] text-neutral-600 font-medium">{a.trigger}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-2.5 bg-neutral-50 border-t border-neutral-100">
                    <span className="text-[11px] text-neutral-400">Template: <code className="text-neutral-600">{a.template}</code></span>
                  </div>
                </div>
              ))}

              <p className="text-[12px] text-neutral-400 pb-2">
                To add or modify automation triggers, go to your Wix dashboard → Automations → set the trigger condition and point the webhook to <code className="text-neutral-600">/api/email/send</code>.
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
