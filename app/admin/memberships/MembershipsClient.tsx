'use client'

import { useState, useMemo } from 'react'
import type { WixMembership } from '@/lib/wix'
import { useSettings } from '@/lib/useSettings'

type MembershipRow = WixMembership & {
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

export default function MembershipsClient({ rows }: Props) {
  const [tab, setTab]       = useState<TabKey>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort]     = useState<SortKey>('start-desc')
  const [planFilter, setPlanFilter] = useState('all')
  const [selected, setSelected]     = useState<MembershipRow | null>(null)
  const { settings } = useSettings()
  const expiringDays = settings.expiringDays

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
      <div className="shrink-0 px-6 py-5 border-b border-neutral-200 bg-neutral-50 space-y-4">
        {/* Top-line stats */}
        <div className="flex items-stretch gap-4">
          <StatCard label="Active memberships" value={String(activeCount)} />
          <StatCard label={`Expiring within ${expiringDays} days`} value={String(expiringCount)} warn={expiringCount > 0} />
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

      {/* ── Toolbar ── */}
      <div className="shrink-0 px-6 py-3 border-b border-neutral-200 bg-white flex items-center gap-3 flex-wrap">
        {/* Status tabs */}
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

      {/* ── Table header ── */}
      <div
        className="shrink-0 grid px-6 py-2 border-b border-neutral-200 bg-neutral-50"
        style={{ gridTemplateColumns: '2fr 2fr 120px 130px 130px 48px' }}
      >
        {['Client', 'Plan', 'Status', 'Started', 'Expires / renews', ''].map(h => (
          <span key={h} className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">{h}</span>
        ))}
      </div>

      {/* ── Rows ── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-sm text-neutral-400 text-center">
            No memberships match your filters.
          </div>
        ) : (
          filtered.map(row => {
            const soon = isExpiringSoon(row, expiringDays)
            const days = daysUntil(row.endDate)

            return (
              <div
                key={row.id}
                className="grid items-center px-6 py-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                style={{ gridTemplateColumns: '2fr 2fr 120px 130px 130px 48px' }}
                onClick={() => setSelected(row)}
              >
                {/* Client */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                    {initials(row.clientName)}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900 truncate">{row.clientName}</p>
                    {row.email && <p className="text-[11px] text-neutral-400 truncate">{row.email}</p>}
                  </div>
                </div>

                {/* Plan */}
                <span className="text-[12.5px] text-neutral-700 truncate pr-4">{row.planName || '—'}</span>

                {/* Status */}
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full w-fit ${STATUS_BADGE[row.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                  {statusLabel(row.status)}
                </span>

                {/* Started */}
                <span className="text-[12px] text-neutral-500">{fmtDate(row.startDate)}</span>

                {/* Expires */}
                <div>
                  <span className="text-[12px] text-neutral-500">{fmtDate(row.endDate)}</span>
                  {soon && days !== null && (
                    <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                      {days === 0 ? 'Today' : `${days}d left`}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <button
                  className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-700 transition-colors text-base"
                  onClick={e => e.stopPropagation()}
                >⋯</button>
              </div>
            )
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-6 py-5 border-t border-neutral-200 bg-white flex items-center gap-8">
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Showing</p>
          <p className="text-xl font-semibold text-neutral-900 mt-0.5">{filtered.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Total orders</p>
          <p className="text-xl font-semibold text-neutral-900 mt-0.5">{rows.length}</p>
        </div>
      </div>

      {/* ── Detail drawer ── */}
      {selected && (
        <MembershipDrawer row={selected} expiringDays={expiringDays} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function MembershipDrawer({ row, expiringDays, onClose }: { row: MembershipRow; expiringDays: number; onClose: () => void }) {
  const days = daysUntil(row.endDate)
  const soon = isExpiringSoon(row, expiringDays)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[380px] bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200">

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
            <InfoRow label="Started"         value={fmtDate(row.startDate)} />
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
              <ActionBtn label="Pause membership" />
            )}
            {row.status === 'PAUSED' && (
              <ActionBtn label="Resume membership" />
            )}
            {(row.status === 'ACTIVE' || row.status === 'PAUSED') && (
              <ActionBtn label="Cancel membership" />
            )}
            <ActionBtn label="View client profile" />
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

function ActionBtn({ label }: { label: string }) {
  return (
    <button className="w-full h-9 px-4 text-[13px] border border-neutral-200 rounded-lg text-neutral-700 hover:border-black hover:text-black transition-colors text-left">
      {label}
    </button>
  )
}
