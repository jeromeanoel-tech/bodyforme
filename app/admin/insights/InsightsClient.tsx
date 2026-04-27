'use client'

import { useState, useMemo } from 'react'
import type { WixMembership } from '@/lib/wix'
import { DEFAULT_SETTINGS, SETTINGS_KEY } from '@/lib/settings'

type ContactSlim  = { id: string; createdDate: string }
type SessionSlim  = { id: string; start: string; bookedCount: number; capacity: number; name: string }

type Props = {
  contacts:    ContactSlim[]
  memberships: WixMembership[]
  sessions:    SessionSlim[]
}

type Range = '30d' | '90d' | 'all'

function loadInitialRange(): Range {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS.insightsDefaultRange
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS.insightsDefaultRange
    return JSON.parse(raw).insightsDefaultRange ?? DEFAULT_SETTINGS.insightsDefaultRange
  } catch {
    return DEFAULT_SETTINGS.insightsDefaultRange
  }
}

function loadFillWarning(): number {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS.fillRateWarningPct
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS.fillRateWarningPct
    return JSON.parse(raw).fillRateWarningPct ?? DEFAULT_SETTINGS.fillRateWarningPct
  } catch {
    return DEFAULT_SETTINGS.fillRateWarningPct
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function msAgo(days: number) { return Date.now() - days * 86400000 }

function monthKey(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' })
}

function lastNMonths(n: number): string[] {
  const keys: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(d.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' }))
  }
  return keys
}

function pct(num: number, den: number) {
  return den > 0 ? Math.round((num / den) * 100) : 0
}

// ── Main component ────────────────────────────────────────────────────────────

export default function InsightsClient({ contacts, memberships, sessions }: Props) {
  const [range, setRange] = useState<Range>(loadInitialRange)
  const fillWarning = loadFillWarning()

  const cutoff = range === '30d' ? msAgo(30) : range === '90d' ? msAgo(90) : 0

  // ── Filtered slices ──────────────────────────────────────────────────────────
  const recentContacts    = contacts.filter(c => new Date(c.createdDate).getTime() >= cutoff)
  const recentMemberships = memberships.filter(m => new Date(m.startDate).getTime() >= cutoff)
  const recentSessions    = sessions.filter(s => new Date(s.start).getTime() >= cutoff)
  const activeMemberships = memberships.filter(m => m.status === 'ACTIVE')

  // ── Top-line stats ───────────────────────────────────────────────────────────
  const totalBooked   = recentSessions.reduce((n, s) => n + s.bookedCount, 0)
  const totalCapacity = recentSessions.reduce((n, s) => n + s.capacity,    0)
  const avgFill       = pct(totalBooked, totalCapacity)

  // ── New clients per month (last 6 months) ────────────────────────────────────
  const months6     = lastNMonths(6)
  const clientsByMonth = useMemo(() => {
    const map: Record<string, number> = Object.fromEntries(months6.map(m => [m, 0]))
    contacts.forEach(c => {
      const k = monthKey(c.createdDate)
      if (k in map) map[k]++
    })
    return months6.map(m => ({ label: m, value: map[m] }))
  }, [contacts, months6])

  // ── New orders per month (last 6 months) ─────────────────────────────────────
  const ordersByMonth = useMemo(() => {
    const map: Record<string, number> = Object.fromEntries(months6.map(m => [m, 0]))
    memberships.forEach(m => {
      const k = monthKey(m.startDate)
      if (k in map) map[k]++
    })
    return months6.map(m => ({ label: m, value: map[m] }))
  }, [memberships, months6])

  // ── Active memberships by plan ───────────────────────────────────────────────
  const byPlan = useMemo(() => {
    const map: Record<string, number> = {}
    activeMemberships.forEach(m => {
      if (m.planName) map[m.planName] = (map[m.planName] ?? 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [activeMemberships])

  // ── Class performance (top 8 by sessions in range) ───────────────────────────
  const classPerfMap = useMemo(() => {
    const map: Record<string, { sessions: number; booked: number; capacity: number }> = {}
    recentSessions.forEach(s => {
      if (!map[s.name]) map[s.name] = { sessions: 0, booked: 0, capacity: 0 }
      map[s.name].sessions++
      map[s.name].booked   += s.bookedCount
      map[s.name].capacity += s.capacity
    })
    return Object.entries(map)
      .map(([name, d]) => ({ name, ...d, fill: pct(d.booked, d.capacity) }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 8)
  }, [recentSessions])

  // ── Membership status breakdown ───────────────────────────────────────────────
  const statusBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    memberships.forEach(m => { map[m.status] = (map[m.status] ?? 0) + 1 })
    const order = ['ACTIVE', 'PAUSED', 'ENDED', 'CANCELED', 'PENDING']
    return order.filter(s => map[s]).map(s => ({ status: s, count: map[s] }))
  }, [memberships])

  const maxClients = Math.max(...clientsByMonth.map(d => d.value), 1)
  const maxOrders  = Math.max(...ordersByMonth.map(d => d.value), 1)
  const maxPlan    = Math.max(...byPlan.map(d => d[1]), 1)

  const RANGE_LABEL: Record<Range, string> = { '30d': 'Last 30 days', '90d': 'Last 90 days', 'all': 'All time' }

  return (
    <div className="h-full overflow-y-auto bg-neutral-50">
      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Insights</h1>
            <p className="text-sm text-neutral-500 mt-0.5">{RANGE_LABEL[range]}</p>
          </div>
          <div className="flex items-center gap-1">
            {(['30d', '90d', 'all'] as Range[]).map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`h-8 px-3 text-sm rounded-lg border transition-colors ${
                  range === r ? 'bg-black text-white border-black' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
                }`}
              >
                {r === 'all' ? 'All time' : r}
              </button>
            ))}
          </div>
        </div>

        {/* ── Top-line stats ── */}
        <div className="grid grid-cols-4 gap-4">
          <TopStat label="New clients"        value={String(recentContacts.length)}    sub={`vs ${contacts.length} total`} />
          <TopStat label="Active memberships" value={String(activeMemberships.length)} sub={`${memberships.length} total orders`} />
          <TopStat label="New memberships"    value={String(recentMemberships.length)} sub="in period" />
          <TopStat label="Avg fill rate"      value={`${avgFill}%`}                   sub={`${totalBooked} bookings · ${recentSessions.length} sessions`} />
        </div>

        {/* ── Charts row ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* New clients per month */}
          <ChartCard title="New clients" subtitle="by month (last 6 months)">
            <BarChart
              bars={clientsByMonth.map(d => ({ label: d.label, value: d.value, max: maxClients }))}
            />
          </ChartCard>

          {/* New orders per month */}
          <ChartCard title="New membership orders" subtitle="by month (last 6 months)">
            <BarChart
              bars={ordersByMonth.map(d => ({ label: d.label, value: d.value, max: maxOrders }))}
            />
          </ChartCard>
        </div>

        {/* ── Plan breakdown + status ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Active memberships by plan */}
          <ChartCard title="Active memberships by plan" subtitle={`${activeMemberships.length} active`}>
            {byPlan.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4">No active memberships.</p>
            ) : (
              <div className="space-y-3 py-2">
                {byPlan.map(([name, count]) => (
                  <div key={name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12.5px] text-neutral-700">{name}</span>
                      <span className="text-[12px] font-semibold text-neutral-900">{count}</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all"
                        style={{ width: `${pct(count, maxPlan)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>

          {/* Membership status breakdown */}
          <ChartCard title="All orders by status" subtitle={`${memberships.length} total`}>
            {statusBreakdown.length === 0 ? (
              <p className="text-sm text-neutral-400 py-4">No data.</p>
            ) : (
              <div className="space-y-3 py-2">
                {statusBreakdown.map(({ status, count }) => {
                  const label = status === 'ENDED' ? 'Expired' : status === 'CANCELED' ? 'Cancelled' : status.charAt(0) + status.slice(1).toLowerCase()
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12.5px] text-neutral-700">{label}</span>
                        <span className="text-[12px] font-semibold text-neutral-900">
                          {count} <span className="text-neutral-400 font-normal">({pct(count, memberships.length)}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${status === 'ACTIVE' ? 'bg-black' : 'bg-neutral-300'}`}
                          style={{ width: `${pct(count, memberships.length)}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── Class performance table ── */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100">
            <h3 className="text-[13px] font-semibold text-neutral-900">Class performance</h3>
            <p className="text-[11.5px] text-neutral-400 mt-0.5">{RANGE_LABEL[range]} · top 8 by session count</p>
          </div>

          {/* Table header */}
          <div className="grid px-5 py-2 bg-neutral-50 border-b border-neutral-100"
            style={{ gridTemplateColumns: '2fr 80px 80px 80px 120px' }}>
            {['Class', 'Sessions', 'Booked', 'Capacity', 'Avg fill rate'].map(h => (
              <span key={h} className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          {classPerfMap.length === 0 ? (
            <p className="px-5 py-8 text-sm text-neutral-400">No session data for this period.</p>
          ) : (
            classPerfMap.map((row, i) => (
              <div
                key={row.name}
                className={`grid items-center px-5 py-3 ${i < classPerfMap.length - 1 ? 'border-b border-neutral-100' : ''}`}
                style={{ gridTemplateColumns: '2fr 80px 80px 80px 120px' }}
              >
                <span className="text-[13px] font-medium text-neutral-800">{row.name}</span>
                <span className="text-[12.5px] text-neutral-600">{row.sessions}</span>
                <span className="text-[12.5px] text-neutral-600">{row.booked}</span>
                <span className="text-[12.5px] text-neutral-600">{Math.round(row.capacity / row.sessions)}</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.fill >= 80 ? 'bg-black' : row.fill >= fillWarning ? 'bg-neutral-500' : 'bg-neutral-300'}`}
                      style={{ width: `${row.fill}%` }}
                    />
                  </div>
                  <span className="text-[12px] font-semibold text-neutral-700 w-8 text-right">{row.fill}%</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}

// ── Chart components ──────────────────────────────────────────────────────────

function BarChart({ bars }: { bars: { label: string; value: number; max: number }[] }) {
  return (
    <div className="flex items-end gap-2 h-36 pt-2">
      {bars.map(bar => (
        <div key={bar.label} className="flex-1 flex flex-col items-center gap-1.5 h-full">
          <div className="flex-1 w-full flex items-end">
            <div
              className="w-full bg-black rounded-t-md transition-all"
              style={{ height: bar.max === 0 ? '2px' : `${Math.max((bar.value / bar.max) * 100, bar.value > 0 ? 4 : 0)}%` }}
            />
          </div>
          <span className="text-[9.5px] text-neutral-400 leading-tight text-center">{bar.label}</span>
          <span className="text-[11px] font-semibold text-neutral-700">{bar.value}</span>
        </div>
      ))}
    </div>
  )
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4">
      <h3 className="text-[13px] font-semibold text-neutral-900">{title}</h3>
      <p className="text-[11.5px] text-neutral-400 mt-0.5 mb-4">{subtitle}</p>
      {children}
    </div>
  )
}

function TopStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-xl px-5 py-4">
      <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-semibold text-neutral-900 mt-1">{value}</p>
      <p className="text-[11.5px] text-neutral-400 mt-1">{sub}</p>
    </div>
  )
}
