'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Membership } from '@/lib/db'
import { useSettings } from '@/lib/useSettings'

type MembershipRow = Membership & {
  clientName: string
  email: string
  phone: string
}

type Props = { rows: MembershipRow[] }

type TabKey  = 'all' | 'active' | 'expiring' | 'paused' | 'expired' | 'cancelled'
type SortKey = 'client-asc' | 'client-desc' | 'start-desc' | 'start-asc' | 'end-asc' | 'end-desc'

const STATUS_BADGE: Record<string, string> = {
  ACTIVE:   'bg-black text-white',
  PAUSED:   'bg-neutral-200 text-neutral-700',
  ENDED:    'bg-neutral-100 text-neutral-400',
  CANCELED: 'bg-neutral-100 text-neutral-400',
  PENDING:  'bg-neutral-100 text-neutral-500',
  DRAFT:    'bg-neutral-100 text-neutral-400',
}

function statusLabel(s: string) {
  if (s === 'ENDED')    return 'Expired'
  if (s === 'CANCELED') return 'Cancelled'
  return s.charAt(0) + s.slice(1).toLowerCase()
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

function daysUntil(iso: string) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function isExpiringSoon(m: MembershipRow, threshold: number) {
  const days = daysUntil(m.endDate)
  return m.status === 'ACTIVE' && days !== null && days >= 0 && days <= threshold
}

type BulkSendState = 'idle' | 'confirming' | 'sending' | 'done'

function isDDPlan(planName: string) {
  const p = planName.toLowerCase()
  return (
    /direct.?debit/i.test(planName) ||
    p.includes('unlimited') ||
    p.includes('per week') ||
    p.includes('weekly-')
  )
}

export default function MembershipsClient({ rows: initialRows }: Props) {
  const [rows, setRows]     = useState<MembershipRow[]>(initialRows)
  const [tab, setTab]       = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState<SortKey>('start-desc')
  const [planFilter, setPlanFilter] = useState('all')
  const [selected, setSelected]     = useState<MembershipRow | null>(null)
  const { settings } = useSettings()
  const expiringDays = settings.expiringDays
  const router = useRouter()

  // Live refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(interval)
  }, [router])

  // Bulk DD email send
  const [bulkState, setBulkState]   = useState<BulkSendState>('idle')
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0 })
  const [bulkErrors, setBulkErrors] = useState<string[]>([])

  const ddTargets = useMemo(() =>
    rows.filter(r =>
      r.status === 'ACTIVE' &&
      isDDPlan(r.planName ?? '') &&
      r.email &&
      !r.email.includes('@bodyforme.placeholder')
    )
  , [rows])

  async function sendDDEmails() {
    setBulkState('sending')
    setBulkProgress({ sent: 0, total: ddTargets.length })
    setBulkErrors([])
    const errs: string[] = []
    for (let i = 0; i < ddTargets.length; i++) {
      const m = ddTargets[i]
      const [firstName] = m.clientName.split(' ')
      try {
        const res = await fetch('/api/email/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: m.email,
            template: 'dd-payment-setup',
            vars: { firstName, planName: m.planName },
          }),
        })
        if (!res.ok) errs.push(`${m.clientName}: server error`)
      } catch {
        errs.push(`${m.clientName}: network error`)
      }
      setBulkProgress({ sent: i + 1, total: ddTargets.length })
    }
    setBulkErrors(errs)
    setBulkState('done')
  }

  function handleStatusChange(id: string, status: string) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    setSelected(null)
  }

  // Stats
  const activeCount   = rows.filter(r => r.status === 'ACTIVE').length
  const expiringCount = rows.filter(r => isExpiringSoon(r, expiringDays)).length
  const pausedCount   = rows.filter(r => r.status === 'PAUSED').length

  // Plan breakdown (active only)
  const planBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    rows.filter(r => r.status === 'ACTIVE').forEach(r => {
      if (r.planName) map[r.planName] = (map[r.planName] ?? 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [rows])

  const uniquePlans = useMemo(() =>
    rows.map(r => r.planName).filter(Boolean).filter((n, i, a) => a.indexOf(n) === i).sort()
  , [rows])

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'all',       label: 'All',           count: rows.length },
    { key: 'active',    label: 'Active',         count: activeCount },
    { key: 'expiring',  label: 'Expiring soon',  count: expiringCount },
    { key: 'paused',    label: 'Paused',         count: pausedCount },
    { key: 'expired',   label: 'Expired',        count: rows.filter(r => r.status === 'ENDED').length },
    { key: 'cancelled', label: 'Cancelled',      count: rows.filter(r => r.status === 'CANCELED').length },
  ]

  const filtered = useMemo(() => {
    let list = rows

    if (tab === 'active')    list = list.filter(r => r.status === 'ACTIVE')
    if (tab === 'expiring')  list = list.filter(r => isExpiringSoon(r, expiringDays))
    if (tab === 'paused')    list = list.filter(r => r.status === 'PAUSED')
    if (tab === 'expired')   list = list.filter(r => r.status === 'ENDED')
    if (tab === 'cancelled') list = list.filter(r => r.status === 'CANCELED')

    if (planFilter !== 'all') list = list.filter(r => r.planName === planFilter)

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(r =>
        r.clientName.toLowerCase().includes(q) ||
        r.planName.toLowerCase().includes(q)   ||
        r.email.toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => {
      if (sort === 'client-asc')  return a.clientName.localeCompare(b.clientName)
      if (sort === 'client-desc') return b.clientName.localeCompare(a.clientName)
      if (sort === 'start-desc')  return b.startDate.localeCompare(a.startDate)
      if (sort === 'start-asc')   return a.startDate.localeCompare(b.startDate)
      if (sort === 'end-asc')     return (a.endDate || '9').localeCompare(b.endDate || '9')
      if (sort === 'end-desc')    return (b.endDate || '0').localeCompare(a.endDate || '0')
      return 0
    })
  }, [rows, tab, planFilter, search, sort, expiringDays])

  return (
    <div className="h-full flex flex-col">

      {/* ── Stats + plan breakdown ── */}
      <div className="shrink-0 px-4 md:px-6 py-4 md:py-5 border-b border-neutral-200 bg-neutral-50 space-y-3 md:space-y-4">
        {/* Top-line stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <StatCard label="Active memberships" value={String(activeCount)} />
          <StatCard label={`Expiring in ${expiringDays}d`} value={String(expiringCount)} warn={expiringCount > 0} />
          <StatCard label="Paused" value={String(pausedCount)} />
          <StatCard label="Total orders" value={String(rows.length)} />
        </div>

        {/* Plan breakdown pills */}
        {planBreakdown.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mr-1">Active by plan</span>
            {planBreakdown.map(([name, count]) => (
              <button
                key={name}
                onClick={() => setPlanFilter(planFilter === name ? 'all' : name)}
                className={`flex items-center gap-1.5 h-7 px-3 text-[12px] rounded-full border transition-colors ${
                  planFilter === name
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-neutral-700 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                {name}
                <span className={`text-[10px] font-semibold px-1 ${planFilter === name ? 'text-white/70' : 'text-neutral-400'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Toolbar — mobile ── */}
      <div className="md:hidden shrink-0 px-4 py-3 border-b border-neutral-200 bg-white space-y-2">
        <input
          type="text"
          placeholder="Search client or plan…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
        />
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`h-8 px-3 text-[13px] rounded-lg border transition-colors whitespace-nowrap flex items-center gap-1.5 shrink-0 touch-manipulation ${
                tab === t.key
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-600 border-neutral-200'
              }`}
            >
              {t.label}
              {t.count > 0 && <span className={`text-[10px] font-semibold ${tab === t.key ? 'text-white/70' : 'text-neutral-400'}`}>{t.count}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toolbar — desktop ── */}
      <div className="hidden md:flex shrink-0 px-6 py-3 border-b border-neutral-200 bg-white items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`h-8 px-3 text-sm rounded-lg border transition-colors flex items-center gap-1.5 ${
                tab === t.key
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-neutral-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <select
            value={sort}
            onChange={e => setSort(e.target.value as SortKey)}
            className="h-8 px-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black bg-white text-neutral-700"
          >
            <option value="start-desc">Started: newest</option>
            <option value="start-asc">Started: oldest</option>
            <option value="end-asc">Expiring: soonest</option>
            <option value="end-desc">Expiring: latest</option>
            <option value="client-asc">Client A–Z</option>
            <option value="client-desc">Client Z–A</option>
          </select>
          <input
            type="text"
            placeholder="Search client or plan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black w-56"
          />
        </div>
      </div>

      {/* ── Table header — desktop only ── */}
      <div
        className="hidden md:grid shrink-0 px-6 py-2 border-b border-neutral-200 bg-neutral-50"
        style={{ gridTemplateColumns: '2fr 2fr 120px 130px 130px 48px' }}
      >
        {['Client', 'Plan', 'Status', 'Started', 'Expires / renews', ''].map(h => (
          <span key={h} className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">{h}</span>
        ))}
      </div>

      {/* ── Rows ── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 md:px-6 py-12 text-sm text-neutral-400 text-center">
            No memberships match your filters.
          </div>
        ) : (
          filtered.map(row => {
            const soon = isExpiringSoon(row, expiringDays)
            const days = daysUntil(row.endDate)

            return (
              <div key={row.id} className="border-b border-neutral-100">

                {/* ── Mobile card ── */}
                <div
                  className="md:hidden flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => setSelected(row)}
                >
                  <div className="w-9 h-9 rounded-full bg-neutral-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                    {initials(row.clientName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-neutral-900 truncate">{row.clientName}</p>
                    <p className="text-[11.5px] text-neutral-500 truncate mt-0.5">{row.planName || '—'}</p>
                    {row.endDate && (
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {soon && days !== null
                          ? <span className="text-amber-600 font-medium">{days === 0 ? 'Expires today' : `${days}d left`}</span>
                          : `Expires ${fmtDate(row.endDate)}`
                        }
                      </p>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[row.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                    {statusLabel(row.status)}
                  </span>
                </div>

                {/* ── Desktop row (unchanged) ── */}
                <div
                  className="hidden md:grid items-center px-6 py-3 hover:bg-neutral-50 transition-colors cursor-pointer"
                  style={{ gridTemplateColumns: '2fr 2fr 120px 130px 130px 48px' }}
                  onClick={() => setSelected(row)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {initials(row.clientName)}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900 truncate">{row.clientName}</p>
                      {row.email && <p className="text-[11px] text-neutral-400 truncate">{row.email}</p>}
                    </div>
                  </div>
                  <span className="text-[12.5px] text-neutral-700 truncate pr-4">{row.planName || '—'}</span>
                  <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full w-fit ${STATUS_BADGE[row.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                    {statusLabel(row.status)}
                  </span>
                  <span className="text-[12px] text-neutral-500">{fmtDate(row.startDate)}</span>
                  <div>
                    <span className="text-[12px] text-neutral-500">{fmtDate(row.endDate)}</span>
                    {soon && days !== null && (
                      <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                        {days === 0 ? 'Today' : `${days}d left`}
                      </p>
                    )}
                  </div>
                  <button
                    className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-700 transition-colors text-base"
                    onClick={e => { e.stopPropagation(); setSelected(row) }}
                  >⋯</button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 md:px-6 py-4 md:py-5 border-t border-neutral-200 bg-white flex items-center gap-6 md:gap-8">
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Showing</p>
          <p className="text-xl font-semibold text-neutral-900 mt-0.5">{filtered.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Total orders</p>
          <p className="text-xl font-semibold text-neutral-900 mt-0.5">{rows.length}</p>
        </div>
        {ddTargets.length > 0 && (
          <div className="ml-auto">
            <button
              onClick={() => setBulkState('confirming')}
              className="h-9 px-4 text-[13px] border border-neutral-200 rounded-lg text-neutral-700 hover:border-black hover:text-black transition-colors flex items-center gap-2"
            >
              <span>✉</span>
              Send payment setup emails
              <span className="text-[10px] font-semibold bg-neutral-100 text-neutral-500 px-1.5 py-0.5 rounded-full">
                {ddTargets.length}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ── Bulk send modal ── */}
      {bulkState !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => bulkState !== 'sending' && setBulkState('idle')} />
          <div className="relative bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full md:w-[480px] max-h-[80vh] flex flex-col overflow-hidden">

            <div className="px-6 py-5 border-b border-neutral-200">
              <h2 className="font-semibold text-neutral-900">
                {bulkState === 'confirming' && 'Send payment setup emails'}
                {bulkState === 'sending'    && 'Sending…'}
                {bulkState === 'done'       && 'All done'}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {bulkState === 'confirming' && (
                <>
                  <p className="text-[13px] text-neutral-600 mb-4">
                    This will email <strong>{ddTargets.length} active direct debit members</strong> asking them to pop in and set up their payment details. Members without an email are skipped automatically.
                  </p>
                  <div className="space-y-1">
                    {ddTargets.map(m => (
                      <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-0">
                        <span className="text-[13px] text-neutral-800">{m.clientName}</span>
                        <span className="text-[11px] text-neutral-400 truncate max-w-[200px]">{m.email}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {bulkState === 'sending' && (
                <div className="space-y-4">
                  <div className="w-full bg-neutral-100 rounded-full h-2">
                    <div
                      className="bg-black h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(bulkProgress.sent / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-[13px] text-neutral-600 text-center">
                    {bulkProgress.sent} of {bulkProgress.total} sent…
                  </p>
                </div>
              )}

              {bulkState === 'done' && (
                <>
                  <p className="text-[13px] text-neutral-600 mb-3">
                    Sent <strong>{bulkProgress.total - bulkErrors.length}</strong> of <strong>{bulkProgress.total}</strong> emails successfully.
                  </p>
                  {bulkErrors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                      <p className="text-[11.5px] font-semibold text-red-700 uppercase tracking-wide mb-2">Failed</p>
                      {bulkErrors.map((e, i) => (
                        <p key={i} className="text-[12px] text-red-600">{e}</p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-neutral-200 flex justify-end gap-2">
              {bulkState === 'confirming' && (
                <>
                  <button onClick={() => setBulkState('idle')} className="h-9 px-4 text-[13px] border border-neutral-200 rounded-lg text-neutral-600 hover:border-neutral-400">
                    Cancel
                  </button>
                  <button onClick={sendDDEmails} className="h-9 px-4 text-[13px] bg-black text-white rounded-lg hover:bg-neutral-800">
                    Send {ddTargets.length} emails
                  </button>
                </>
              )}
              {bulkState === 'done' && (
                <button onClick={() => setBulkState('idle')} className="h-9 px-4 text-[13px] bg-black text-white rounded-lg hover:bg-neutral-800">
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Detail drawer ── */}
      {selected && (
        <MembershipDrawer row={selected} expiringDays={expiringDays} onClose={() => setSelected(null)} onStatusChange={handleStatusChange} />
      )}
    </div>
  )
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function MembershipDrawer({ row, expiringDays, onClose, onStatusChange }: {
  row: MembershipRow
  expiringDays: number
  onClose: () => void
  onStatusChange: (id: string, status: string) => void
}) {
  const router = useRouter()
  const days = daysUntil(row.endDate)
  const soon = isExpiringSoon(row, expiringDays)
  const [loading, setLoading] = useState<string | null>(null)
  const [confirmAction, setConfirmAction] = useState<'pause' | 'resume' | 'cancel' | null>(null)

  async function updateStatus(newStatus: string, action: string) {
    setLoading(action)
    const res = await fetch('/api/admin/memberships', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: row.id, status: newStatus }),
    })
    if (res.ok) {
      onStatusChange(row.id, newStatus)
      onClose()
      router.refresh()
    }
    setLoading(null)
    setConfirmAction(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full md:w-[380px] bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200">

        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
                {initials(row.clientName)}
              </div>
              <div>
                <h2 className="font-semibold text-neutral-900">{row.clientName}</h2>
                <p className="text-[12px] text-neutral-500 mt-0.5">{row.email || row.phone || '—'}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl">×</button>
          </div>
        </div>

        {/* Membership detail */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Plan + status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-1">Plan</p>
              <p className="text-[15px] font-semibold text-neutral-900">{row.planName || '—'}</p>
            </div>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_BADGE[row.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
              {statusLabel(row.status)}
            </span>
          </div>

          <div className="border-t border-neutral-100" />

          {/* Dates */}
          <div className="space-y-3">
            <InfoRow label="Started" value={fmtDate(row.startDate)} />
            <InfoRow
              label={row.status === 'ACTIVE' ? 'Renews / expires' : 'Ended'}
              value={fmtDate(row.endDate)}
            />
            {soon && days !== null && (
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-2.5">
                <span className="text-[12.5px] text-neutral-700 font-medium">
                  {days === 0 ? 'Expires today' : `Expires in ${days} day${days === 1 ? '' : 's'}`}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-100" />

          {/* Payment health placeholder */}
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-3">Payment health</p>
            <div className="flex items-center justify-between py-2">
              <span className="text-[12.5px] text-neutral-600">Last charge</span>
              <span className="text-[12.5px] text-neutral-400">Stripe sync coming soon</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-[12.5px] text-neutral-600">Failed payments</span>
              <span className="text-[12.5px] text-neutral-400">Stripe sync coming soon</span>
            </div>
          </div>

          <div className="border-t border-neutral-100" />

          {/* Quick actions */}
          <div className="space-y-2">
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-3">Actions</p>

            {row.status === 'ACTIVE' && (
              confirmAction === 'pause' ? (
                <div className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg">
                  <span className="text-[12px] text-neutral-600 flex-1">Pause this membership?</span>
                  <button onClick={() => updateStatus('PAUSED', 'pause')} disabled={loading === 'pause'}
                    className="h-7 px-3 text-[11.5px] font-semibold text-white bg-black rounded-md disabled:opacity-40">
                    {loading === 'pause' ? '…' : 'Yes, pause'}
                  </button>
                  <button onClick={() => setConfirmAction(null)} className="h-7 px-2 text-[11.5px] text-neutral-500 hover:text-neutral-800">No</button>
                </div>
              ) : (
                <ActionBtn label="Pause membership" onClick={() => setConfirmAction('pause')} />
              )
            )}

            {row.status === 'PAUSED' && (
              confirmAction === 'resume' ? (
                <div className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg">
                  <span className="text-[12px] text-neutral-600 flex-1">Resume this membership?</span>
                  <button onClick={() => updateStatus('ACTIVE', 'resume')} disabled={loading === 'resume'}
                    className="h-7 px-3 text-[11.5px] font-semibold text-white bg-black rounded-md disabled:opacity-40">
                    {loading === 'resume' ? '…' : 'Yes, resume'}
                  </button>
                  <button onClick={() => setConfirmAction(null)} className="h-7 px-2 text-[11.5px] text-neutral-500 hover:text-neutral-800">No</button>
                </div>
              ) : (
                <ActionBtn label="Resume membership" onClick={() => setConfirmAction('resume')} />
              )
            )}

            {(row.status === 'ACTIVE' || row.status === 'PAUSED') && (
              confirmAction === 'cancel' ? (
                <div className="flex items-center gap-2 p-2 border border-red-100 rounded-lg">
                  <span className="text-[12px] text-neutral-600 flex-1">Cancel this membership?</span>
                  <button onClick={() => updateStatus('CANCELED', 'cancel')} disabled={loading === 'cancel'}
                    className="h-7 px-3 text-[11.5px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-40">
                    {loading === 'cancel' ? '…' : 'Yes, cancel'}
                  </button>
                  <button onClick={() => setConfirmAction(null)} className="h-7 px-2 text-[11.5px] text-neutral-500 hover:text-neutral-800">No</button>
                </div>
              ) : (
                <ActionBtn label="Cancel membership" onClick={() => setConfirmAction('cancel')} danger />
              )
            )}

            <ActionBtn label="View client profile" onClick={() => { onClose(); router.push(`/admin/clients?highlight=${row.contactId}`) }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Reusable ──────────────────────────────────────────────────────────────────

function StatCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex-1 bg-white border border-neutral-200 rounded-xl px-4 py-3">
      <p className="text-[10.5px] text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-semibold mt-0.5 ${warn ? 'text-neutral-900' : 'text-neutral-900'}`}>{value}</p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-neutral-400">{label}</span>
      <span className="text-[12.5px] text-neutral-800 font-medium">{value}</span>
    </div>
  )
}

function ActionBtn({ label, onClick, danger }: { label: string; onClick?: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full h-9 px-4 text-[13px] border rounded-lg transition-colors text-left ${
        danger
          ? 'border-neutral-200 text-red-600 hover:border-red-300 hover:bg-red-50'
          : 'border-neutral-200 text-neutral-700 hover:border-black hover:text-black'
      }`}
    >
      {label}
    </button>
  )
}
