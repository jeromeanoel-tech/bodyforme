'use client'

import Link from 'next/link'
import type { WixMembership, WixContact, WixSession, WixService } from '@/lib/wix'

type Props = {
  sessions:    WixSession[]
  memberships: WixMembership[]
  contacts:    WixContact[]
  services:    WixService[]
}

function fmt12(iso: string) {
  if (!iso) return ''
  const [, time] = iso.split('T')
  const [h, m] = time.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const h12  = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

function daysUntil(iso: string) {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000)
}

function pct(n: number, d: number) {
  return d > 0 ? Math.round((n / d) * 100) : 0
}

export default function DashboardClient({ sessions, memberships, contacts, services }: Props) {
  const scheduleToName = Object.fromEntries(services.map(s => [s.scheduleId, s.name]))

  const todayStr      = new Date().toISOString().slice(0, 10)
  const todaySessions = sessions
    .filter(s => s.start.startsWith(todayStr) && s.status !== 'CANCELLED')
    .sort((a, b) => a.start.localeCompare(b.start))

  const activeMembers  = memberships.filter(m => m.status === 'ACTIVE')
  const expiringSoon   = activeMembers.filter(m => {
    const d = daysUntil(m.endDate)
    return d !== null && d >= 0 && d <= 14
  })

  const thirtyDaysAgo = Date.now() - 30 * 86400000
  const recentSignups = contacts
    .filter(c => new Date(c.createdDate).getTime() >= thirtyDaysAgo)
    .sort((a, b) => b.createdDate.localeCompare(a.createdDate))
    .slice(0, 5)

  const totalBookedToday = todaySessions.reduce((n, s) => n + s.bookedCount, 0)
  const totalCapToday    = todaySessions.reduce((n, s) => n + s.capacity, 0)

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening'
  const dateLabel = now.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="h-full overflow-y-auto bg-neutral-50">
      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">{greeting}</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{dateLabel}</p>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            label="Today's classes"
            value={String(todaySessions.length)}
            sub={totalCapToday > 0 ? `${totalBookedToday} booked · ${pct(totalBookedToday, totalCapToday)}% fill` : 'No sessions'}
            href="/admin/schedule"
          />
          <StatCard
            label="Active members"
            value={String(activeMembers.length)}
            sub={`${memberships.length} total orders`}
            href="/admin/memberships"
          />
          <StatCard
            label="Expiring within 14 days"
            value={String(expiringSoon.length)}
            sub="need renewal"
            warn={expiringSoon.length > 0}
            href="/admin/memberships"
          />
          <StatCard
            label="New clients (30d)"
            value={String(recentSignups.length)}
            sub={`${contacts.length} total`}
            href="/admin/clients"
          />
        </div>

        {/* Today's schedule + recent signups */}
        <div className="grid grid-cols-2 gap-4">

          {/* Today's classes */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-neutral-900">Today&apos;s classes</h3>
              <Link href="/admin/schedule" className="text-[12px] text-neutral-400 hover:text-neutral-700 transition-colors">
                View schedule →
              </Link>
            </div>
            {todaySessions.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400">No classes scheduled today.</p>
            ) : (
              todaySessions.map((s, i) => {
                const fill = pct(s.bookedCount, s.capacity)
                const full = s.bookedCount >= s.capacity
                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-4 px-5 py-3 ${i < todaySessions.length - 1 ? 'border-b border-neutral-100' : ''}`}
                  >
                    <span className="text-[11.5px] text-neutral-400 w-16 shrink-0">{fmt12(s.start)}</span>
                    <span className="text-[13px] font-medium text-neutral-800 flex-1 truncate">
                      {scheduleToName[s.scheduleId] ?? s.title}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${full ? 'bg-red-400' : 'bg-black'}`}
                          style={{ width: `${Math.min(fill, 100)}%` }}
                        />
                      </div>
                      <span className={`text-[12px] font-semibold w-12 text-right ${full ? 'text-red-500' : 'text-neutral-700'}`}>
                        {s.bookedCount}/{s.capacity}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Recent signups */}
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-neutral-900">Recent sign-ups</h3>
              <Link href="/admin/clients" className="text-[12px] text-neutral-400 hover:text-neutral-700 transition-colors">
                View all →
              </Link>
            </div>
            {recentSignups.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-400">No new clients in the last 30 days.</p>
            ) : (
              recentSignups.map((c, i) => {
                const name = `${c.firstName} ${c.lastName}`.trim() || '—'
                const initials = `${c.firstName[0] ?? ''}${c.lastName[0] ?? ''}`.toUpperCase()
                return (
                  <div
                    key={c.id}
                    className={`flex items-center gap-3 px-5 py-3 ${i < recentSignups.length - 1 ? 'border-b border-neutral-100' : ''}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-neutral-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-neutral-900 truncate">{name}</p>
                      <p className="text-[11px] text-neutral-400 truncate">{c.email || 'No email'}</p>
                    </div>
                    <span className="text-[11px] text-neutral-400 shrink-0">{fmtDate(c.createdDate)}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Expiring memberships */}
        {expiringSoon.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-[13px] font-semibold text-neutral-900">Memberships expiring soon</h3>
                <p className="text-[11.5px] text-neutral-400 mt-0.5">Within 14 days — may need a follow-up</p>
              </div>
              <Link href="/admin/memberships" className="text-[12px] text-neutral-400 hover:text-neutral-700 transition-colors">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-neutral-100">
              {expiringSoon.slice(0, 6).map(m => {
                const days = daysUntil(m.endDate)!
                return (
                  <div key={m.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-[13px] font-medium text-neutral-900">{m.planName}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Expires {fmtDate(m.endDate)}</p>
                    </div>
                    <span className={`text-[12px] font-semibold px-2.5 py-1 rounded-full ${
                      days <= 3 ? 'bg-neutral-100 text-neutral-700' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {days === 0 ? 'Today' : days === 1 ? 'Tomorrow' : `${days}d`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'View schedule',    href: '/admin/schedule'    },
            { label: 'Client list',      href: '/admin/clients'     },
            { label: 'Memberships',      href: '/admin/memberships' },
            { label: 'Insights',         href: '/admin/insights'    },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center h-10 bg-white border border-neutral-200 rounded-xl text-[13px] text-neutral-600 hover:border-black hover:text-black transition-colors font-medium"
            >
              {label}
            </Link>
          ))}
        </div>

      </div>
    </div>
  )
}

// ── Primitives ────────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, warn, href,
}: {
  label: string; value: string; sub: string; warn?: boolean; href: string
}) {
  return (
    <Link href={href} className="bg-white border border-neutral-200 rounded-xl px-5 py-4 hover:border-neutral-400 transition-colors block">
      <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className={`text-3xl font-semibold mt-1 ${warn ? 'text-neutral-900' : 'text-neutral-900'}`}>{value}</p>
      <p className="text-[11.5px] text-neutral-400 mt-1">{sub}</p>
    </Link>
  )
}
