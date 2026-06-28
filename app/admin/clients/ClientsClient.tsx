'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Contact, ContactBooking, Membership, MemberCredential } from '@/lib/db'
import { useSettings } from '@/lib/useSettings'
import { StripeSetupForm } from '@/components/StripeSetupForm'
import { StripeSubscriptionPanel } from '@/components/StripeSubscriptionPanel'

type Props = {
  contacts: Contact[]
  membershipsByContact: Record<string, Membership[]>
  planNames: string[]
}

// ── Types ─────────────────────────────────────────────────────────────────────

type ColKey  = 'email' | 'phone' | 'since' | 'membership'
type SortKey = 'name-asc' | 'name-desc' | 'newest' | 'oldest'

// Filter keys: preset strings OR 'plan:PlanName' OR 'mem:STATUS'
type FilterKey = string

interface FilterDef { key: FilterKey; label: string }

const PRESET_FILTERS: FilterDef[] = [
  { key: 'new',       label: 'New members (last 30d)' },
  { key: 'has-email', label: 'Has email' },
  { key: 'no-email',  label: 'No email on file' },
  { key: 'has-phone', label: 'Has phone' },
  { key: 'no-phone',  label: 'No phone on file' },
]

const MEMBERSHIP_STATUS_FILTERS: FilterDef[] = [
  { key: 'mem:ACTIVE',   label: 'Active membership' },
  { key: 'mem:none',     label: 'No membership' },
  { key: 'mem:PAUSED',   label: 'Paused membership' },
  { key: 'mem:ENDED',    label: 'Expired membership' },
  { key: 'mem:CANCELED', label: 'Cancelled membership' },
]

const ALL_COLS: { key: ColKey; label: string; width: string }[] = [
  { key: 'email',      label: 'Email',        width: '2fr'   },
  { key: 'phone',      label: 'Phone',        width: '160px' },
  { key: 'since',      label: 'Member since', width: '140px' },
  { key: 'membership', label: 'Membership',   width: '200px' },
]

function isNew(d: string, days: number) {
  return Boolean(d) && Date.now() - new Date(d).getTime() < days * 86400000
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const MELB = 'Australia/Melbourne'

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { timeZone: MELB, day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-AU', { timeZone: MELB, weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('en-AU', { timeZone: MELB, hour: 'numeric', minute: '2-digit', hour12: true })
  )
}

// True if a YYYY-MM-DD expiry date is in the past by Melbourne calendar date
function isExpiredMelb(endDateStr: string): boolean {
  const todayMelb = new Intl.DateTimeFormat('en-CA', { timeZone: MELB }).format(new Date())
  return todayMelb > endDateStr
}

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase()
}

function filterLabel(key: FilterKey): string {
  if (key.startsWith('plan:')) return `Plan: ${key.slice(5)}`
  if (key.startsWith('mem:')) {
    const s = key.slice(4)
    if (s === 'none')     return 'No membership'
    if (s === 'ACTIVE')   return 'Active membership'
    if (s === 'PAUSED')   return 'Paused membership'
    if (s === 'ENDED')    return 'Expired membership'
    if (s === 'CANCELED') return 'Cancelled membership'
    return `Membership: ${s}`
  }
  return PRESET_FILTERS.find(f => f.key === key)?.label ?? key
}

function activeMembership(mems: Membership[]): Membership | undefined {
  return (
    mems.find(m => m.status === 'ACTIVE') ??
    mems.find(m => m.status === 'PAUSED') ??
    mems.sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
  )
}

const MEM_STATUS_BADGE: Record<string, string> = {
  ACTIVE:   'bg-black text-white',
  PAUSED:   'bg-neutral-200 text-neutral-600',
  ENDED:    'bg-neutral-100 text-neutral-400',
  CANCELED: 'bg-neutral-100 text-neutral-400',
  PENDING:  'bg-neutral-100 text-neutral-500',
}

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED:  'bg-neutral-100 text-neutral-600',
  ATTENDED:   'bg-black text-white',
  CANCELLED:  'bg-neutral-100 text-neutral-400',
  WAITLISTED: 'bg-neutral-100 text-neutral-500',
}

function applyFilter(key: FilterKey, contact: Contact, mems: Membership[], newMemberDays: number): boolean {
  if (key === 'new')       return isNew(contact.createdDate, newMemberDays)
  if (key === 'has-email') return !!contact.email
  if (key === 'no-email')  return !contact.email
  if (key === 'has-phone') return !!contact.phone
  if (key === 'no-phone')  return !contact.phone
  if (key === 'mem:none')  return mems.length === 0
  if (key.startsWith('mem:')) {
    const status = key.slice(4)
    return mems.some(m => m.status === status)
  }
  if (key.startsWith('plan:')) {
    const planName = key.slice(5)
    return mems.some(m => m.planName === planName)
  }
  return true
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ClientsClient({ contacts, membershipsByContact, planNames }: Props) {
  const router = useRouter()
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<SortKey>('name-asc')
  const [cols, setCols]         = useState<ColKey[]>(['email', 'phone', 'since', 'membership'])
  const [filters, setFilters]   = useState<FilterKey[]>([])
  const [colsOpen, setColsOpen]     = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selected, setSelected]     = useState<Contact | null>(null)
  const [menuId, setMenuId]         = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const { settings } = useSettings()
  const newMemberDays = settings.newMemberDays

  // Auto-open a specific contact if ?client=<id> is in the URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const clientId = params.get('client')
    if (!clientId) return
    const contact = contacts.find(c => c.id === clientId)
    if (contact) setSelected(contact)
    // Clean the param from the URL without a page reload
    const url = new URL(window.location.href)
    url.searchParams.delete('client')
    window.history.replaceState({}, '', url.toString())
  }, [contacts])

  // New client modal
  const [showNewClient, setShowNewClient]   = useState(false)
  const [ncFirstName, setNcFirstName]       = useState('')
  const [ncLastName, setNcLastName]         = useState('')
  const [ncEmail, setNcEmail]               = useState('')
  const [ncPhone, setNcPhone]               = useState('')
  const [ncPlan, setNcPlan]                 = useState('')
  const [ncSaving, setNcSaving]             = useState(false)
  const [ncError, setNcError]               = useState('')
  const [ncTempPass, setNcTempPass]         = useState('')
  const [ncPayLink,       setNcPayLink]       = useState('')
  const [ncClientSecret,  setNcClientSecret]  = useState('')
  const [ncPayLoading,    setNcPayLoading]    = useState(false)

  async function createClient() {
    if (!ncFirstName.trim() || !ncEmail.trim()) { setNcError('First name and email are required'); return }
    setNcSaving(true); setNcError('')
    const tempPass = Math.random().toString(36).slice(2, 10) + 'A1!'
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName: ncFirstName.trim(), lastName: ncLastName.trim(), email: ncEmail.trim().toLowerCase(), phone: ncPhone.trim(), suburb: '', password: tempPass, plan: ncPlan || undefined }),
    })
    const data = await res.json()
    if (!res.ok) { setNcError(data.error ?? 'Failed to create client'); setNcSaving(false); return }
    setNcTempPass(tempPass)
    setNcSaving(false)
  }

  async function generatePayLink() {
    setNcPayLoading(true)
    try {
      const res  = await fetch('/api/admin/create-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ncEmail.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (res.ok && data.clientSecret) setNcClientSecret(data.clientSecret)
    } catch { /* network error — button re-enables */ }
    setNcPayLoading(false)
  }

  function resetNewClient() {
    setShowNewClient(false); setNcFirstName(''); setNcLastName(''); setNcEmail(''); setNcPhone(''); setNcPlan(''); setNcError(''); setNcTempPass(''); setNcPayLink(''); setNcClientSecret(''); setNcPayLoading(false)
  }

  const [bulkStripeRunning, setBulkStripeRunning] = useState(false)
  const [bulkStripeResult,  setBulkStripeResult]  = useState<string | null>(null)

  async function bulkCreateStripeCustomers() {
    setBulkStripeRunning(true); setBulkStripeResult(null)
    try {
      const res  = await fetch('/api/admin/bulk-create-stripe-customers', { method: 'POST' })
      const data = await res.json()
      setBulkStripeResult(`Done — ${data.created} created, ${data.skipped} skipped (no email), ${data.failed} failed`)
    } catch {
      setBulkStripeResult('Network error — please try again')
    }
    setBulkStripeRunning(false)
  }

  const colsRef   = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (colsRef.current   && !colsRef.current.contains(e.target as Node))   setColsOpen(false)
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggleCol(k: ColKey) {
    setCols(prev => prev.includes(k) ? prev.filter(c => c !== k) : [...prev, k])
  }

  function addFilter(k: FilterKey) {
    if (!filters.includes(k)) setFilters(prev => [...prev, k])
    setFilterOpen(false)
  }

  function removeFilter(k: FilterKey) {
    setFilters(prev => prev.filter(f => f !== k))
  }

  const newCount = useMemo(() => contacts.filter(c => isNew(c.createdDate, newMemberDays)).length, [contacts, newMemberDays])

  const filtered = useMemo(() => {
    let list = contacts

    for (const f of filters) {
      list = list.filter(c => applyFilter(f, c, membershipsByContact[c.id] ?? [], newMemberDays))
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q)  ||
        c.email.toLowerCase().includes(q)     ||
        c.phone.includes(q)
      )
    }

    return [...list].sort((a, b) => {
      if (sort === 'name-asc')  return `${a.lastName}${a.firstName}`.localeCompare(`${b.lastName}${b.firstName}`)
      if (sort === 'name-desc') return `${b.lastName}${b.firstName}`.localeCompare(`${a.lastName}${a.firstName}`)
      if (sort === 'newest')    return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
      if (sort === 'oldest')    return new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime()
      return 0
    })
  }, [contacts, filters, search, sort, membershipsByContact, newMemberDays])

  const gridCols = [
    '32px',
    '2fr',
    ...ALL_COLS.filter(c => cols.includes(c.key)).map(c => c.width),
    '48px',
  ].join(' ')

  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selectedIds.has(c.id))

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        filtered.forEach(c => next.delete(c.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        filtered.forEach(c => next.add(c.id))
        return next
      })
    }
  }

  function exportCSV() {
    const rows = filtered.filter(c => selectedIds.has(c.id))
    const header = 'First name,Last name,Email,Phone,Member since,Membership'
    const lines  = rows.map(c => {
      const mem = activeMembership(membershipsByContact[c.id] ?? [])
      return [
        c.firstName, c.lastName, c.email, c.phone,
        c.createdDate ? new Date(c.createdDate).toLocaleDateString('en-AU') : '',
        mem?.planName ?? c.planOverride ?? '',
      ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
    })
    const csv  = [header, ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `bodyforme-clients-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  // Build available filter options grouped into sections
  const planFilters: FilterDef[] = planNames.map(n => ({ key: `plan:${n}`, label: n }))
  const allAvailable = [
    ...PRESET_FILTERS,
    ...MEMBERSHIP_STATUS_FILTERS,
    ...planFilters,
  ].filter(f => !filters.includes(f.key))

  const availableGroups: { heading: string; items: FilterDef[] }[] = [
    { heading: 'General',           items: allAvailable.filter(f => PRESET_FILTERS.some(p => p.key === f.key)) },
    { heading: 'Membership status', items: allAvailable.filter(f => f.key.startsWith('mem:')) },
    { heading: 'Plan type',         items: allAvailable.filter(f => f.key.startsWith('plan:')) },
  ].filter(g => g.items.length > 0)

  return (
    <div className="h-full flex flex-col">

      {/* ── Toolbar — mobile ── */}
      <div className="md:hidden shrink-0 px-4 py-3 border-b border-neutral-200 bg-white space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 h-10 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
          />
          {/* Filter button — mobile */}
          <div ref={filterRef} className="relative md:hidden">
            <button
              onClick={() => setFilterOpen(o => !o)}
              disabled={allAvailable.length === 0}
              className={`h-10 px-3 text-sm border rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-40 touch-manipulation ${
                filters.length > 0 ? 'bg-black text-white border-black' : 'border-neutral-200 text-neutral-600'
              }`}
            >
              Filter{filters.length > 0 ? ` (${filters.length})` : ''}
            </button>
            {filterOpen && availableGroups.length > 0 && (
              <div className="absolute top-12 right-0 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg py-2 w-64 max-h-80 overflow-y-auto">
                {availableGroups.map(group => (
                  <div key={group.heading}>
                    <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      {group.heading}
                    </p>
                    {group.items.map(f => (
                      <button
                        key={f.key}
                        onClick={() => addFilter(f.key)}
                        className="w-full text-left px-4 py-2.5 text-[13px] text-neutral-700 hover:bg-neutral-50 touch-manipulation"
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowNewClient(true)}
            className="h-10 px-3 text-sm bg-black text-white rounded-lg font-medium whitespace-nowrap touch-manipulation"
          >
            + New
          </button>
        </div>
        {filters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filters.map(k => (
              <span key={k} className="flex items-center gap-1 h-8 px-2.5 text-[11.5px] bg-black text-white rounded-lg">
                {filterLabel(k)}
                <button onClick={() => removeFilter(k)} className="text-white/60 hover:text-white ml-0.5 w-5 h-5 flex items-center justify-center">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Toolbar — desktop ── */}
      <div className="hidden md:block shrink-0 px-6 py-3 border-b border-neutral-200 bg-white">
        <div className="flex items-center gap-2 flex-wrap">

          {/* Columns */}
          <div ref={colsRef} className="relative">
            <button
              onClick={() => { setColsOpen(o => !o); setFilterOpen(false) }}
              className="h-8 px-3 text-sm border border-neutral-200 rounded-lg text-neutral-600 hover:border-neutral-400 transition-colors flex items-center gap-1.5"
            >
              Columns
              <span className="text-[10px] bg-neutral-100 text-neutral-500 font-semibold px-1.5 py-0.5 rounded-full">
                {cols.length}
              </span>
              <span className="text-neutral-400 text-xs">▾</span>
            </button>
            {colsOpen && (
              <div className="absolute top-10 left-0 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 w-48">
                {ALL_COLS.map(c => (
                  <label key={c.key} className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 cursor-pointer">
                    <input type="checkbox" checked={cols.includes(c.key)} onChange={() => toggleCol(c.key)} className="accent-black" />
                    <span className="text-[13px] text-neutral-700">{c.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Filter + */}
          <div ref={filterRef} className="relative">
            <button
              onClick={() => { setFilterOpen(o => !o); setColsOpen(false) }}
              disabled={allAvailable.length === 0}
              className="h-8 px-3 text-sm border border-neutral-200 rounded-lg text-neutral-600 hover:border-neutral-400 transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              Filter +
            </button>
            {filterOpen && availableGroups.length > 0 && (
              <div className="absolute top-10 left-0 z-30 bg-white border border-neutral-200 rounded-xl shadow-lg py-2 w-60 max-h-80 overflow-y-auto">
                {availableGroups.map(group => (
                  <div key={group.heading}>
                    <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      {group.heading}
                    </p>
                    {group.items.map(f => (
                      <button
                        key={f.key}
                        onClick={() => addFilter(f.key)}
                        className="w-full text-left px-4 py-2 text-[13px] text-neutral-700 hover:bg-neutral-50"
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active filter chips */}
          {filters.map(k => (
            <span key={k} className="flex items-center gap-1.5 h-8 px-3 text-[12.5px] bg-black text-white rounded-lg">
              {filterLabel(k)}
              <button onClick={() => removeFilter(k)} className="text-white/60 hover:text-white leading-none ml-0.5">×</button>
            </span>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="h-8 px-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black bg-white text-neutral-700"
            >
              <option value="name-asc">Name A–Z</option>
              <option value="name-desc">Name Z–A</option>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
            <input
              type="text"
              placeholder="Search name, email or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black w-60"
            />
            <button
              onClick={() => setShowNewClient(true)}
              className="h-8 px-3 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium whitespace-nowrap">
              + New Client
            </button>
            <button
              onClick={bulkCreateStripeCustomers}
              disabled={bulkStripeRunning}
              className="h-8 px-3 text-sm border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400 transition-colors whitespace-nowrap disabled:opacity-40">
              {bulkStripeRunning ? 'Creating…' : 'Sync → Stripe'}
            </button>
            {bulkStripeResult && (
              <span className="text-[11px] text-neutral-500">{bulkStripeResult}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Table header — desktop only ── */}
      <div
        className="hidden md:grid shrink-0 px-6 py-2 border-b border-neutral-200 bg-neutral-50"
        style={{ gridTemplateColumns: gridCols }}
      >
        <input
          type="checkbox"
          checked={allFilteredSelected}
          onChange={toggleSelectAll}
          className="accent-black self-center"
          title="Select all"
        />
        <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Name</span>
        {ALL_COLS.filter(c => cols.includes(c.key)).map(c => (
          <span key={c.key} className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">
            {c.label}
          </span>
        ))}
        <span />
      </div>

      {/* ── Rows ── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-6 py-12 text-sm text-neutral-400 text-center">
            {search || filters.length > 0 ? 'No clients match your filters.' : 'No clients yet.'}
          </div>
        ) : (
          filtered.map(contact => {
            const fresh = isNew(contact.createdDate, newMemberDays)
            const mems  = membershipsByContact[contact.id] ?? []
            const mem   = activeMembership(mems)

            // members.status is the operational source of truth — if it says inactive,
            // override the memberships table (which can lag behind due to async webhooks).
            const effectiveMem = contact.memberStatus === 'inactive' ? null : mem

            const memBadgeClass = effectiveMem
              ? MEM_STATUS_BADGE[effectiveMem.status] ?? 'bg-neutral-100 text-neutral-500'
              : contact.memberStatus === 'active'    ? 'bg-black text-white'
              : contact.memberStatus === 'inactive'  ? 'bg-red-500 text-white'
              : contact.memberStatus === 'paused'    ? 'bg-neutral-200 text-neutral-600'
              : contact.memberStatus === 'cancelled' ? 'bg-neutral-100 text-neutral-400'
              : 'bg-neutral-100 text-neutral-500'

            const memLabel = effectiveMem
              ? effectiveMem.status === 'ENDED' ? 'Expired' : effectiveMem.status === 'CANCELED' ? 'Cancelled' : effectiveMem.status.charAt(0) + effectiveMem.status.slice(1).toLowerCase()
              : contact.memberStatus
              ? contact.memberStatus.charAt(0).toUpperCase() + contact.memberStatus.slice(1)
              : ''

            const planLabel = mem?.planName ?? contact.planOverride ?? ''

            return (
              <div key={contact.id} className="border-b border-neutral-100">

                {/* ── Mobile card ── */}
                <div
                  className="md:hidden flex items-center gap-3 px-4 py-3.5 hover:bg-neutral-50 cursor-pointer transition-colors"
                  onClick={() => setSelected(contact)}
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-900 text-white text-[12px] font-semibold flex items-center justify-center shrink-0">
                    {initials(contact.firstName, contact.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[13px] font-medium text-neutral-900 truncate">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {fresh && (
                        <span className="text-[9.5px] font-semibold bg-black text-white px-1.5 py-0.5 rounded-full shrink-0">New</span>
                      )}
                    </div>
                    <p className="text-[11.5px] text-neutral-400 truncate mt-0.5">{contact.email || 'No email'}</p>
                  </div>
                  {planLabel ? (
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {memLabel && (
                        <span className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded-full ${memBadgeClass}`}>
                          {memLabel}
                        </span>
                      )}
                      <p className="text-[10.5px] text-neutral-500 truncate max-w-[110px] text-right">{planLabel}</p>
                    </div>
                  ) : (
                    <span className="text-[11px] text-neutral-300 shrink-0">—</span>
                  )}
                </div>

                {/* ── Desktop row (unchanged) ── */}
                <div
                  className={`hidden md:grid items-center px-6 py-3 hover:bg-neutral-50 transition-colors cursor-pointer ${selectedIds.has(contact.id) ? 'bg-neutral-50' : ''}`}
                  style={{ gridTemplateColumns: gridCols }}
                  onClick={() => setSelected(contact)}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(contact.id)}
                    onChange={() => toggleSelect(contact.id)}
                    onClick={e => e.stopPropagation()}
                    className="accent-black self-center"
                  />
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                      {initials(contact.firstName, contact.lastName)}
                    </div>
                    <span className="text-[13px] font-medium text-neutral-900 truncate">
                      {contact.firstName} {contact.lastName}
                    </span>
                    {fresh && (
                      <span className="text-[10px] font-semibold bg-black text-white px-1.5 py-0.5 rounded-full shrink-0">New</span>
                    )}
                  </div>

                  {cols.includes('email')      && <span className="text-[12.5px] text-neutral-600 truncate pr-4">{contact.email || '—'}</span>}
                  {cols.includes('phone')      && <span className="text-[12.5px] text-neutral-600">{contact.phone || '—'}</span>}
                  {cols.includes('since')      && <span className="text-[12px] text-neutral-500">{fmtDate(contact.createdDate)}</span>}
                  {cols.includes('membership') && (
                    mem ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-neutral-700 truncate">{mem.planName}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                          contact.memberStatus === 'inactive' ? 'bg-red-500 text-white' : MEM_STATUS_BADGE[mem.status] ?? 'bg-neutral-100 text-neutral-500'
                        }`}>
                          {contact.memberStatus === 'inactive' ? 'Inactive' : mem.status === 'ENDED' ? 'Expired' : mem.status === 'CANCELED' ? 'Cancelled' : mem.status.charAt(0) + mem.status.slice(1).toLowerCase()}
                        </span>
                      </div>
                    ) : contact.planOverride ? (
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-neutral-700 truncate">{contact.planOverride}</span>
                        {contact.memberStatus && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                            contact.memberStatus === 'active'    ? 'bg-green-100 text-green-700' :
                            contact.memberStatus === 'inactive'  ? 'bg-red-500 text-white' :
                            contact.memberStatus === 'paused'    ? 'bg-yellow-100 text-yellow-700' :
                            contact.memberStatus === 'cancelled' ? 'bg-red-100 text-red-600' :
                            'bg-neutral-100 text-neutral-500'
                          }`}>
                            {contact.memberStatus.charAt(0).toUpperCase() + contact.memberStatus.slice(1)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[12px] text-neutral-400">—</span>
                    )
                  )}

                  <RowMenu
                    contact={contact}
                    open={menuId === contact.id}
                    onOpen={id => setMenuId(id)}
                    onClose={() => setMenuId(null)}
                    onViewProfile={() => { setSelected(contact); setMenuId(null) }}
                  />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Bulk action bar ── */}
      {selectedIds.size > 0 && (
        <div className="shrink-0 px-4 md:px-6 py-3 border-t border-neutral-200 bg-black flex items-center gap-3">
          <span className="text-[13px] font-medium text-white">
            {selectedIds.size} selected
          </span>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-[12px] text-white/50 hover:text-white transition-colors underline"
          >
            Clear
          </button>
          <div className="flex-1" />
          <button
            onClick={exportCSV}
            className="h-8 px-4 text-[12.5px] font-medium bg-white text-black rounded-lg hover:bg-neutral-100 transition-colors"
          >
            Export CSV
          </button>
          <a
            href="/admin/marketing"
            className="h-8 px-4 text-[12.5px] font-medium bg-neutral-700 text-white rounded-lg hover:bg-neutral-600 transition-colors flex items-center"
          >
            Send email
          </a>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-4 md:px-6 py-4 md:py-5 border-t border-neutral-200 bg-white flex items-center gap-6 md:gap-8">
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Total Clients</p>
          <p className="text-xl font-semibold text-neutral-900 mt-0.5">{contacts.length}</p>
        </div>
        <div>
          <p className="text-[11px] text-neutral-400 uppercase tracking-wider">New This Month</p>
          <p className="text-xl font-semibold text-neutral-900 mt-0.5">{newCount}</p>
        </div>
        {(search || filters.length > 0) && (
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Filtered</p>
            <p className="text-xl font-semibold text-neutral-900 mt-0.5">{filtered.length}</p>
          </div>
        )}
      </div>

      {selected && (
        <ClientDrawer
          contact={selected}
          memberships={membershipsByContact[selected.id] ?? []}
          newMemberDays={newMemberDays}
          onClose={() => setSelected(null)}
          onDelete={() => { setSelected(null); router.refresh() }}
        />
      )}

      {/* New client modal */}
      {showNewClient && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={resetNewClient} />
          <div className="relative bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full md:w-[420px] p-6 pb-8 md:pb-6">
            {ncTempPass ? (
              <>
                <h2 className="text-[15px] font-semibold text-neutral-900 mb-2">Client created</h2>
                <p className="text-[13px] text-neutral-600 mb-4">Share these login details with <strong>{ncFirstName}</strong>:</p>
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-2 font-mono text-sm">
                  <div><span className="text-neutral-400">Email: </span>{ncEmail}</div>
                  <div><span className="text-neutral-400">Password: </span><strong>{ncTempPass}</strong></div>
                  {ncPlan && <div><span className="text-neutral-400">Plan: </span>{ncPlan}</div>}
                </div>
                <p className="text-[11.5px] text-neutral-400 mt-3">They can change their password after logging in at bodyforme.com.au/app/login</p>

                {/* Payment setup */}
                <div className="mt-4 p-3 bg-neutral-50 border border-neutral-200 rounded-lg space-y-2">
                  <p className="text-[12px] font-medium text-neutral-900">Set up direct debit or card</p>
                  {ncPayLink === 'done' ? (
                    <p className="text-[11.5px] text-green-600 font-medium">Payment details saved ✓</p>
                  ) : ncClientSecret ? (
                    <StripeSetupForm
                      clientSecret={ncClientSecret}
                      onSuccess={() => setNcPayLink('done')}
                      onCancel={() => { setNcClientSecret(''); setNcPayLink('') }}
                    />
                  ) : (
                    <>
                      <p className="text-[11.5px] text-neutral-600">Enter {ncFirstName}&apos;s BSB and account number (or card) below.</p>
                      <button onClick={generatePayLink} disabled={ncPayLoading}
                        className="h-7 px-3 text-[11.5px] border border-neutral-300 text-neutral-700 rounded-lg hover:border-black hover:text-black transition-colors disabled:opacity-40">
                        {ncPayLoading ? 'Loading…' : 'Enter payment details'}
                      </button>
                    </>
                  )}
                </div>

                <div className="flex justify-end mt-5">
                  <button onClick={() => { resetNewClient(); window.location.reload() }}
                    className="h-8 px-4 text-[12.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800">
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">New client</h2>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[12px] font-medium text-neutral-600 mb-1">First name *</label>
                      <input type="text" value={ncFirstName} onChange={e => setNcFirstName(e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black" autoFocus />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-neutral-600 mb-1">Last name</label>
                      <input type="text" value={ncLastName} onChange={e => setNcLastName(e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-neutral-600 mb-1">Email *</label>
                    <input type="email" value={ncEmail} onChange={e => setNcEmail(e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-neutral-600 mb-1">Phone</label>
                    <input type="tel" value={ncPhone} onChange={e => setNcPhone(e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="block text-[12px] font-medium text-neutral-600 mb-1">Plan</label>
                    <select value={ncPlan} onChange={e => setNcPlan(e.target.value)}
                      className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black bg-white">
                      <option value="">— Set later —</option>
                      {PLAN_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                  {ncError && <p className="text-[12px] text-red-600">{ncError}</p>}
                </div>
                <div className="flex justify-end gap-2 mt-5">
                  <button onClick={resetNewClient}
                    className="h-8 px-4 text-[12.5px] text-neutral-600 border border-neutral-200 rounded-lg hover:border-neutral-400">
                    Cancel
                  </button>
                  <button onClick={createClient} disabled={ncSaving}
                    className="h-8 px-4 text-[12.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40">
                    {ncSaving ? 'Creating…' : 'Create client'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Row context menu ──────────────────────────────────────────────────────────

function RowMenu({
  contact, open, onOpen, onClose, onViewProfile,
}: {
  contact: Contact
  open: boolean
  onOpen: (id: string) => void
  onClose: () => void
  onViewProfile: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  function copyEmail() {
    if (contact.email) navigator.clipboard.writeText(contact.email)
    onClose()
  }

  function copyPhone() {
    if (contact.phone) navigator.clipboard.writeText(contact.phone)
    onClose()
  }

  return (
    <div ref={ref} className="relative flex items-center justify-center">
      <button
        className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-700 transition-colors text-base"
        onClick={e => { e.stopPropagation(); open ? onClose() : onOpen(contact.id) }}
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-40 bg-white border border-neutral-200 rounded-xl shadow-lg py-1.5 w-48">
          <MenuItem label="View profile"  onClick={onViewProfile} />
          <MenuItem label="Book a class"  onClick={() => { onClose(); window.location.href = '/admin/checkin' }} />
          <MenuItem label="Send email"    onClick={() => { window.location.href = `mailto:${contact.email}`; onClose() }} disabled={!contact.email} />
          <div className="my-1 border-t border-neutral-100" />
          <MenuItem label="Copy email"    onClick={copyEmail} disabled={!contact.email} />
          <MenuItem label="Copy phone"    onClick={copyPhone} disabled={!contact.phone} />
        </div>
      )}
    </div>
  )
}

function MenuItem({
  label, onClick, disabled, muted,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  muted?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full text-left px-4 py-2 text-[13px] transition-colors disabled:opacity-30 ${
        muted ? 'text-neutral-400 cursor-default' : 'text-neutral-700 hover:bg-neutral-50'
      }`}
    >
      {label}
    </button>
  )
}

// ── Client drawer ─────────────────────────────────────────────────────────────

type DrawerTab = 'overview' | 'bookings' | 'memberships' | 'notes'

function ClientDrawer({
  contact, memberships, newMemberDays, onClose, onDelete,
}: {
  contact: Contact
  memberships: Membership[]
  newMemberDays: number
  onClose: () => void
  onDelete: () => void
}) {
  const [bookings, setBookings]   = useState<ContactBooking[] | null>(null)
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState<DrawerTab>('overview')
  const [note, setNote]           = useState('')
  const [notes, setNotes]         = useState<{ text: string; date: string }[]>([])
  const [member, setMember]       = useState<MemberCredential | null | undefined>(undefined)
  const [memberLoading, setMemberLoading] = useState(false)

  // Advance booking state
  const [bookingMode, setBookingMode]         = useState(false)
  const [upcomingSessions, setUpcomingSessions] = useState<{ id: string; title: string; start_time: string; end_time: string; bookedCount?: number; capacity: number }[] | null>(null)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [bookingId, setBookingId]             = useState<string | null>(null)
  const [bookingError, setBookingError]       = useState('')

  if (bookings === null && !loading) {
    setLoading(true)
    fetch(`/api/admin/contact-bookings?contactId=${contact.id}`)
      .then(r => r.json())
      .then(d => { setBookings(d.bookings ?? []); setLoading(false) })
      .catch(() => { setBookings([]); setLoading(false) })
  }

  if (member === undefined && !memberLoading) {
    setMemberLoading(true)
    fetch(`/api/admin/member-record?contactId=${contact.id}`)
      .then(r => r.json())
      .then(d => { setMember(d.member ?? null); setMemberLoading(false) })
      .catch(() => { setMember(null); setMemberLoading(false) })
  }

  const attended      = bookings?.filter(b => b.status === 'ATTENDED').length  ?? 0
  const cancelled     = bookings?.filter(b => b.status === 'CANCELLED').length ?? 0
  const totalBookings = bookings?.length ?? 0
  const lastVisit     = bookings?.find(b => b.status === 'ATTENDED')?.start ?? ''
  const activeMem     = activeMembership(memberships)
  const fullName      = `${contact.firstName} ${contact.lastName}`.trim()
  const fresh         = isNew(contact.createdDate, newMemberDays)

  const TABS: { key: DrawerTab; label: string }[] = [
    { key: 'overview',    label: 'Overview' },
    { key: 'bookings',    label: `Bookings${totalBookings ? ` (${totalBookings})` : ''}` },
    { key: 'memberships', label: `Memberships${memberships.length ? ` (${memberships.length})` : ''}` },
    { key: 'notes',       label: `Notes${notes.length ? ` (${notes.length})` : ''}` },
  ]

  function addNote() {
    if (!note.trim()) return
    setNotes(n => [{ text: note.trim(), date: new Date().toISOString() }, ...n])
    setNote('')
  }

  function openBookingMode() {
    setBookingMode(true)
    setBookingError('')
    if (!upcomingSessions) {
      setSessionsLoading(true)
      const now   = new Date()
      const from  = now.toISOString().slice(0, 10) + 'T00:00:00'
      const ahead = new Date(now); ahead.setDate(now.getDate() + 28)
      const to    = ahead.toISOString().slice(0, 10) + 'T23:59:59'
      fetch(`/api/admin/schedule-sessions?from=${from}&to=${to}`)
        .then(r => r.json())
        .then(d => {
          const sess = (d.sessions ?? []).filter((s: {status: string}) => s.status !== 'CANCELLED')
          setUpcomingSessions(sess)
          setSessionsLoading(false)
        })
        .catch(() => { setUpcomingSessions([]); setSessionsLoading(false) })
    }
  }

  async function bookSession(sessionId: string) {
    if (bookingId) return
    setBookingId(sessionId)
    setBookingError('')
    try {
      const res  = await fetch('/api/admin/advance-book', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ memberId: contact.id, sessionId }),
      })
      const data = await res.json()
      if (res.ok) {
        setBookings(prev => [data.booking, ...(prev ?? [])])
        setBookingMode(false)
        setBookingId(null)
      } else {
        setBookingError(data.error ?? 'Booking failed')
        setBookingId(null)
      }
    } catch {
      setBookingError('Network error')
      setBookingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full md:w-[420px] bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200">

        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-neutral-900 text-white text-[13px] font-semibold flex items-center justify-center shrink-0">
                {initials(contact.firstName, contact.lastName)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-neutral-900">{fullName || '—'}</h2>
                  {fresh && <span className="text-[10px] font-semibold bg-black text-white px-1.5 py-0.5 rounded-full">New</span>}
                </div>
                <p className="text-[12px] text-neutral-500 mt-0.5">
                  {(() => {
                    // members.status is the operational source of truth — if it says inactive,
                    // never show the memberships row as Active regardless of what that table says.
                    const effectiveMem = contact.memberStatus === 'inactive' ? undefined : activeMem
                    return effectiveMem
                      ? <>{effectiveMem.planName} · <span className={`font-medium ${effectiveMem.status === 'ACTIVE' ? 'text-neutral-800' : 'text-neutral-400'}`}>{effectiveMem.status.charAt(0) + effectiveMem.status.slice(1).toLowerCase()}</span></>
                      : contact.planOverride
                      ? <>{contact.planOverride} · <span className={`font-medium ${contact.memberStatus === 'active' ? 'text-green-700' : contact.memberStatus === 'inactive' ? 'text-red-600' : 'text-neutral-400'}`}>{contact.memberStatus ? contact.memberStatus.charAt(0).toUpperCase() + contact.memberStatus.slice(1) : ''}</span></>
                      : 'No active membership'
                  })()}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl mt-0.5 w-10 h-10 flex items-center justify-center touch-manipulation">×</button>
          </div>
          <div className="flex gap-2 mt-4">
            <ActionBtn label="Book class" onClick={() => { setTab('bookings'); openBookingMode() }} />
            <ActionBtn label="Send email" />
            <ActionBtn label="Add note" onClick={() => setTab('notes')} />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 px-6 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-2.5 mr-5 text-[12.5px] border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-black text-neutral-900 font-medium'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Overview */}
          {tab === 'overview' && (
            <OverviewTab
              contact={contact}
              loading={loading}
              totalBookings={totalBookings}
              attended={attended}
              cancelled={cancelled}
              lastVisit={lastVisit}
            />
          )}

          {/* Bookings */}
          {tab === 'bookings' && (
            <>
              {/* Book class button / session picker */}
              {!bookingMode ? (
                <div className="px-6 py-3 border-b border-neutral-100 flex items-center justify-between">
                  <p className="text-[11px] text-neutral-400">{totalBookings} booking{totalBookings !== 1 ? 's' : ''} on record</p>
                  <button
                    onClick={openBookingMode}
                    className="h-8 px-3 text-[12px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                  >
                    + Book class
                  </button>
                </div>
              ) : (
                <div className="border-b border-neutral-200 bg-neutral-50">
                  <div className="flex items-center justify-between px-6 py-3">
                    <p className="text-[12px] font-semibold text-neutral-900">Pick a class to book</p>
                    <button onClick={() => { setBookingMode(false); setBookingError('') }} className="text-neutral-400 hover:text-neutral-700 text-lg leading-none">✕</button>
                  </div>
                  {bookingError && <p className="px-6 pb-2 text-[12px] text-red-500">{bookingError}</p>}
                  {sessionsLoading && <p className="px-6 pb-4 text-[12px] text-neutral-400">Loading upcoming classes…</p>}
                  {!sessionsLoading && upcomingSessions?.length === 0 && <p className="px-6 pb-4 text-[12px] text-neutral-400">No upcoming classes found.</p>}
                  {!sessionsLoading && upcomingSessions && upcomingSessions.length > 0 && (
                    <div className="max-h-72 overflow-y-auto">
                      {(() => {
                        const byDay: Record<string, typeof upcomingSessions> = {}
                        upcomingSessions.forEach(s => {
                          const day = s.start_time.slice(0, 10)
                          if (!byDay[day]) byDay[day] = []
                          byDay[day].push(s)
                        })
                        return Object.entries(byDay).map(([day, daySessions]) => (
                          <div key={day}>
                            <p className="px-6 py-1.5 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-100">
                              {new Date(day + 'T12:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
                            </p>
                            {daySessions.map(s => {
                              const isBkg = bookingId === s.id
                              const time  = s.start_time.slice(11, 16)
                              const [h, m] = time.split(':').map(Number)
                              const ampm   = h < 12 ? 'am' : 'pm'
                              const h12    = h % 12 || 12
                              const tFmt   = `${h12}:${m.toString().padStart(2,'0')} ${ampm}`
                              return (
                                <div key={s.id} className="flex items-center justify-between px-6 py-2.5 border-t border-neutral-100 hover:bg-white transition-colors">
                                  <div>
                                    <p className="text-[13px] font-medium text-neutral-900">{s.title}</p>
                                    <p className="text-[11px] text-neutral-400">{tFmt}</p>
                                  </div>
                                  <button
                                    onClick={() => bookSession(s.id)}
                                    disabled={!!bookingId}
                                    className="h-8 px-3 text-[11px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 transition-colors shrink-0"
                                  >
                                    {isBkg ? '…' : 'Book'}
                                  </button>
                                </div>
                              )
                            })}
                          </div>
                        ))
                      })()}
                    </div>
                  )}
                </div>
              )}

              {loading && <p className="px-6 py-6 text-sm text-neutral-400">Loading bookings…</p>}
              {!loading && bookings?.length === 0 && <p className="px-6 py-6 text-sm text-neutral-400">No bookings found.</p>}
              {bookings?.map((b, i) => (
                <div key={b.id} className={`flex items-center justify-between px-6 py-3.5 ${i < (bookings?.length ?? 0) - 1 ? 'border-b border-neutral-100' : ''}`}>
                  <div>
                    <p className="text-[13px] font-medium text-neutral-900">{b.title}</p>
                    <p className="text-[11.5px] text-neutral-400 mt-0.5">{fmtDateTime(b.start)}</p>
                  </div>
                  <span className={`text-[10.5px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[b.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </>
          )}

          {/* Memberships */}
          {tab === 'memberships' && (
            <MembershipsTab
              contact={contact}
              memberships={memberships}
              member={member}
              memberLoading={memberLoading}
              onMemberUpdate={setMember}
              onDelete={onDelete}
            />
          )}

          {/* Notes */}
          {tab === 'notes' && (
            <div className="px-6 py-4 space-y-4">
              <div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note about this client..."
                  rows={3}
                  className="w-full text-sm border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black resize-none"
                />
                <button
                  onClick={addNote}
                  disabled={!note.trim()}
                  className="mt-2 h-8 px-3 text-sm bg-black text-white rounded-lg disabled:opacity-40 hover:bg-neutral-800 transition-colors"
                >
                  Save note
                </button>
              </div>
              {notes.length === 0
                ? <p className="text-sm text-neutral-400">No notes yet.</p>
                : notes.map((n, i) => (
                    <div key={i} className="border border-neutral-100 rounded-lg px-4 py-3">
                      <p className="text-[13px] text-neutral-800 whitespace-pre-wrap">{n.text}</p>
                      <p className="text-[11px] text-neutral-400 mt-1.5">{fmtDateTime(n.date)}</p>
                    </div>
                  ))
              }
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Overview tab (with editable email/phone) ─────────────────────────────────

function OverviewTab({ contact, loading, totalBookings, attended, cancelled, lastVisit }: {
  contact:       Contact
  loading:       boolean
  totalBookings: number
  attended:      number
  cancelled:     number
  lastVisit:     string
}) {
  const [editing, setEditing] = useState(false)
  const [email,   setEmail]   = useState(contact.email || '')
  const [phone,   setPhone]   = useState(contact.phone || '')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  async function saveContact() {
    setSaving(true)
    await fetch('/api/admin/update-member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id, email, phone }),
    })
    setSaving(false)
    setSaved(true)
    setEditing(false)
    contact.email = email
    contact.phone = phone
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b border-neutral-100">
        <StatCard label="Total bookings"   value={loading ? '—' : String(totalBookings)} />
        <StatCard label="Classes attended" value={loading ? '—' : String(attended)} />
        <StatCard label="Cancellations"    value={loading ? '—' : String(cancelled)} />
        <StatCard label="Last visit"        value={loading ? '—' : fmtDate(lastVisit)} />
      </div>
      <div className="px-6 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Contact</p>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 px-2.5 py-1 rounded-md"
            >
              Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-neutral-500 font-medium block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 font-medium block mb-1">Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveContact}
                disabled={saving}
                className="h-8 px-4 text-sm bg-black text-white rounded-lg disabled:opacity-40 hover:bg-neutral-800 transition-colors"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="h-8 px-4 text-sm border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <InfoRow label="Email" value={contact.email || '—'} />
            <InfoRow label="Phone" value={contact.phone || '—'} />
            <InfoRow label="Member since" value={fmtDate(contact.createdDate)} />
            {saved && <p className="text-[11px] text-green-600 font-medium">Saved ✓</p>}
          </>
        )}
      </div>
    </>
  )
}

// ── Memberships tab ───────────────────────────────────────────────────────────

const PLAN_OPTIONS = [
  { label: 'Unlimited (DD)',         value: 'Unlimited' },
  { label: '3 classes/week (DD)',    value: '3 per week' },
  { label: '10-Class Pack',          value: '10-Class Pack' },
  { label: '20-Class Pack',          value: '20-Class Pack' },
  { label: '50-Class Pass',          value: '50-Class Pass' },
  { label: 'Casual Drop-in',         value: 'casual' },
  { label: 'Intro Pass',             value: 'intro-offer' },
  { label: 'Free Trial',             value: 'Free Trial' },
]

const QUICK_PRESETS = [
  { label: 'Unlimited',      plan: 'Unlimited',    credits: 0  },
  { label: '3/week DD',      plan: '3 per week',   credits: 0  },
  { label: '10-class pack',  plan: '10-Class Pack', credits: 10 },
  { label: '20-class pack',  plan: '20-Class Pack', credits: 20 },
  { label: 'Casual',         plan: 'casual',        credits: 1  },
]

// Plans that are class packs / drop-ins (not recurring memberships)
const PACK_KEYWORDS = ['casual', 'drop-in', 'class pack', 'class pass', 'free trial', 'intro', '5-class', '10-class', '20-class', '50-class', '5 class', '10 class', '20 class', '50 class']
function isPack(plan: string): boolean {
  if (!plan) return false
  const p = plan.toLowerCase()
  return PACK_KEYWORDS.some(k => p.includes(k))
}

// Derive the original pack size from the plan name
function packSize(plan: string): number | null {
  const p = plan.toLowerCase()
  if (p.includes('50')) return 50
  if (p.includes('20')) return 20
  if (p.includes('10')) return 10
  if (p.includes('5'))  return 5
  if (p.includes('casual') || p.includes('drop-in') || p.includes('free trial') || p.includes('intro')) return 1
  return null
}

function MembershipsTab({ contact, memberships, member, memberLoading, onMemberUpdate, onDelete }: {
  contact:        Contact
  memberships:    Membership[]
  member:         MemberCredential | null | undefined
  memberLoading:  boolean
  onMemberUpdate: (m: MemberCredential) => void
  onDelete:       () => void
}) {
  const [form, setForm]       = useState<Partial<MemberCredential>>({})
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [editing, setEditing] = useState(false)
  const [adjSaving, setAdjSaving] = useState(false)

  const [pauseOpen,   setPauseOpen]   = useState(false)
  const [pauseFrom,   setPauseFrom]   = useState('')
  const [pauseUntil,  setPauseUntil]  = useState('')
  const [pauseSaving, setPauseSaving] = useState(false)
  const [pauseDone,   setPauseDone]   = useState(false)
  const [pauseError,  setPauseError]  = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting,      setDeleting]      = useState(false)
  const [deleteError,   setDeleteError]   = useState('')

  async function deleteProfile() {
    setDeleting(true)
    setDeleteError('')
    const res = await fetch('/api/admin/delete-member', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId: contact.id }),
    })
    setDeleting(false)
    if (res.ok) {
      onDelete()
    } else {
      const d = await res.json()
      setDeleteError(d.error ?? 'Failed to delete profile')
      setDeleteConfirm(false)
    }
  }

  async function applyPause() {
    if (!member) return
    setPauseSaving(true); setPauseError('')
    const today = new Date().toISOString().slice(0, 10)
    const isNow = !pauseFrom || pauseFrom <= today
    const patch: Record<string, unknown> = { contactId: contact.id }
    if (isNow) {
      patch.status = 'paused'
    } else {
      // Future pause — record intent in adminNotes; admin will need to activate manually or via Stripe
      const note = `[PAUSE PLANNED: ${pauseFrom}${pauseUntil ? ` → ${pauseUntil}` : ''}]`
      const existing = (member.adminNotes ?? '').trim()
      patch.adminNotes = existing ? `${note}\n${existing}` : note
    }
    const res = await fetch('/api/admin/update-member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setPauseSaving(false)
    if (res.ok) {
      setPauseDone(true)
      if (isNow && member) onMemberUpdate({ ...member, status: 'paused' } as MemberCredential)
    } else {
      const d = await res.json()
      setPauseError(d.error ?? 'Failed to save pause')
    }
  }


  useEffect(() => {
    if (member) setForm({
      status:             member.status,
      planOverride:       member.planOverride      || '',
      nextBillingDate:    member.nextBillingDate    || '',
      membershipEndDate:  member.membershipEndDate  || '',
      creditBalance:      member.creditBalance      ?? 0,
      adminNotes:         member.adminNotes         || '',
      paidTerm:           member.paidTerm           || '',
    })
  }, [member])

  const [saveError, setSaveError] = useState('')

  async function save() {
    setSaving(true)
    setSaveError('')
    const res = await fetch('/api/admin/update-member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id, ...form }),
    })
    setSaving(false)
    if (!res.ok) {
      if (res.status === 403) {
        window.location.href = '/admin/login?expired=1'
        return
      }
      const d = await res.json().catch(() => ({}))
      setSaveError(d.error ?? 'Save failed — please try again')
      return
    }
    setSaved(true)
    setEditing(false)
    if (member) onMemberUpdate({ ...member, ...form } as MemberCredential)
    setTimeout(() => setSaved(false), 2000)
  }

  async function adjustCredits(delta: number) {
    if (!member) return
    const next = Math.max(0, (member.creditBalance ?? 0) + delta)
    setAdjSaving(true)
    await fetch('/api/admin/update-member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id, creditBalance: next }),
    })
    onMemberUpdate({ ...member, creditBalance: next })
    setAdjSaving(false)
  }

  async function applyPreset(plan: string, credits: number) {
    if (!member) return
    const patch = { planOverride: plan, status: 'active', creditBalance: credits > 0 ? credits : member.creditBalance }
    setSaving(true)
    await fetch('/api/admin/update-member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id, ...patch }),
    })
    onMemberUpdate({ ...member, ...patch })
    setForm(f => ({ ...f, ...patch }))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }


  // Only show true recurring memberships in history (filter out packs/casual)
  const recurringMems = memberships.filter(m => !isPack(m.planName))

  // Pack usage helpers — safe when member is null/undefined
  const currentIsPack = isPack(member?.planOverride ?? '')
  const size          = currentIsPack ? packSize(member?.planOverride ?? '') : null
  const used          = size !== null ? Math.max(0, size - (member?.creditBalance ?? 0)) : null
  const remaining     = member?.creditBalance ?? 0

  return (
    <div>
      {/* Recurring membership history */}
      {recurringMems.length > 0 && (
        <div className="border-b border-neutral-100">
          <p className="px-6 pt-4 pb-2 text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Membership history</p>
          {recurringMems
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
            .map((m, i) => (
              <div key={m.id} className={`flex items-start justify-between px-6 py-3.5 ${i < recurringMems.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                <div>
                  <p className="text-[13px] font-semibold text-neutral-900">{m.planName || '—'}</p>
                  <p className="text-[11.5px] text-neutral-400 mt-0.5">
                    {m.startDate ? `Started ${fmtDate(m.startDate)}` : ''}{m.endDate ? ` · Ends ${fmtDate(m.endDate)}` : ''}
                  </p>
                </div>
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${MEM_STATUS_BADGE[m.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                  {m.status === 'ENDED' ? 'Expired' : m.status === 'CANCELED' ? 'Cancelled' : m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* App account / admin panel */}
      <div className="px-6 py-4 space-y-4">

        {memberLoading && <p className="text-sm text-neutral-400">Loading…</p>}

        {!memberLoading && !member && (
          <p className="text-[12px] text-neutral-400 italic">No app account yet — they haven&apos;t signed up via the member portal. Create one using &quot;+ New Client&quot; on the Clients page if needed.</p>
        )}

        {!memberLoading && member && (
          <>
            {/* Summary strip */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg px-4 py-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-neutral-400 uppercase tracking-wider mb-0.5">
                    {currentIsPack ? 'Class pack' : 'Current plan'}
                  </p>
                  <p className="text-[13.5px] font-semibold text-neutral-900">{member.planOverride || '—'}</p>
                </div>
                <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full ${
                  member.status === 'active'    ? 'bg-black text-white' :
                  member.status === 'paused'    ? 'bg-neutral-200 text-neutral-700' :
                  member.status === 'cancelled' ? 'bg-neutral-100 text-neutral-400' :
                  'bg-neutral-100 text-neutral-500'
                }`}>
                  {member.status?.charAt(0).toUpperCase()}{member.status?.slice(1)}
                </span>
              </div>

              {/* Pack usage bar — shown only for credit-based plans */}
              {currentIsPack && size !== null && (
                <div>
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-neutral-500">Pack usage</span>
                    <span className="font-semibold text-neutral-900">
                      {used} of {size} used · <span className={remaining <= 2 && remaining > 0 ? 'text-amber-600' : remaining === 0 ? 'text-red-600' : 'text-neutral-700'}>{remaining} remaining</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${remaining === 0 ? 'bg-red-500' : remaining <= 2 ? 'bg-amber-400' : 'bg-black'}`}
                      style={{ width: `${Math.min(100, (used! / size) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[12px]">
                <span className="text-neutral-500">Classes remaining</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => adjustCredits(-1)} disabled={adjSaving || remaining <= 0}
                    className="w-6 h-6 rounded border border-neutral-200 text-neutral-600 hover:border-neutral-400 flex items-center justify-center text-sm font-bold disabled:opacity-30">−</button>
                  <span className={`font-semibold w-8 text-center ${remaining === 0 ? 'text-red-600' : remaining <= 2 ? 'text-amber-600' : 'text-neutral-900'}`}>{remaining}</span>
                  <button onClick={() => adjustCredits(1)} disabled={adjSaving}
                    className="w-6 h-6 rounded border border-neutral-200 text-neutral-600 hover:border-neutral-400 flex items-center justify-center text-sm font-bold disabled:opacity-30">+</button>
                  <button onClick={() => adjustCredits(5)} disabled={adjSaving}
                    className="h-6 px-2 rounded border border-neutral-200 text-[11px] text-neutral-600 hover:border-neutral-400 disabled:opacity-30">+5</button>
                  <button onClick={() => adjustCredits(10)} disabled={adjSaving}
                    className="h-6 px-2 rounded border border-neutral-200 text-[11px] text-neutral-600 hover:border-neutral-400 disabled:opacity-30">+10</button>
                </div>
              </div>
              {member.paidTerm && (
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-neutral-500">Paid term</span>
                  <span className="text-neutral-700">{member.paidTerm}</span>
                </div>
              )}
              {member.nextBillingDate && (
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-neutral-500">Next billing</span>
                  <span className="text-neutral-700">{fmtDate(member.nextBillingDate)}</span>
                </div>
              )}
              {member.membershipEndDate && (
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-neutral-500">Membership expires</span>
                  <span className={`font-medium ${isExpiredMelb(member.membershipEndDate) ? 'text-red-600' : 'text-neutral-700'}`}>
                    {fmtDate(member.membershipEndDate)}
                  </span>
                </div>
              )}
            </div>

            {/* Stripe subscription management */}
            <StripeSubscriptionPanel
              member={member}
              contact={contact}
              onMemberUpdate={onMemberUpdate}
            />

            {/* Quick presets */}
            {!editing && (
              <div>
                <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Quick set plan</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PRESETS.map(p => (
                    <button key={p.plan} onClick={() => applyPreset(p.plan, p.credits)} disabled={saving}
                      className="h-7 px-3 text-[11.5px] border border-neutral-200 rounded-full text-neutral-700 hover:border-black hover:text-black transition-colors disabled:opacity-40">
                      {p.label}
                    </button>
                  ))}
                </div>
                <p className="text-[10.5px] text-neutral-400 mt-1.5">Tap to set plan immediately. Credits auto-filled for class packs.</p>
              </div>
            )}

            {/* Pause membership */}
            {!editing && (
              <div>
                <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Pause membership</p>
                {pauseDone ? (
                  <p className="text-[11.5px] text-green-600 font-medium">
                    {(!pauseFrom || pauseFrom <= new Date().toISOString().slice(0, 10))
                      ? 'Membership paused ✓'
                      : `Pause scheduled for ${pauseFrom} ✓`}
                  </p>
                ) : pauseOpen ? (
                  <div className="space-y-2 p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10.5px] text-neutral-500 mb-1">Pause from</label>
                        <input type="date" value={pauseFrom} onChange={e => setPauseFrom(e.target.value)}
                          min={new Date().toISOString().slice(0, 10)}
                          className="w-full text-[12px] border border-neutral-200 rounded px-2 py-1.5 outline-none focus:border-black" />
                      </div>
                      <div>
                        <label className="block text-[10.5px] text-neutral-500 mb-1">Resume from (optional)</label>
                        <input type="date" value={pauseUntil} onChange={e => setPauseUntil(e.target.value)}
                          min={pauseFrom || new Date().toISOString().slice(0, 10)}
                          className="w-full text-[12px] border border-neutral-200 rounded px-2 py-1.5 outline-none focus:border-black" />
                      </div>
                    </div>
                    <p className="text-[10.5px] text-neutral-400 leading-relaxed">
                      Leave &quot;Pause from&quot; blank or set to today to pause immediately. Future dates are saved as a note — update status manually on the day or handle via Stripe billing portal.
                    </p>
                    {pauseError && <p className="text-[11px] text-red-500">{pauseError}</p>}
                    <div className="flex gap-2">
                      <button onClick={applyPause} disabled={pauseSaving}
                        className="h-7 px-3 text-[11.5px] font-medium bg-black text-white rounded-lg disabled:opacity-40">
                        {pauseSaving ? '…' : 'Confirm'}
                      </button>
                      <button onClick={() => { setPauseOpen(false); setPauseError('') }}
                        className="h-7 px-3 text-[11.5px] border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setPauseOpen(true); setPauseDone(false); setPauseFrom(''); setPauseUntil('') }}
                    className="h-7 px-3 text-[11.5px] border border-neutral-200 rounded-full text-neutral-700 hover:border-black hover:text-black transition-colors">
                    ⏸ Pause membership
                  </button>
                )}
              </div>
            )}

            {/* Edit form */}
            {!editing ? (
              <div className="space-y-2">
                {member.adminNotes && (
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg">
                    <p className="text-[11.5px] text-amber-800 whitespace-pre-wrap">{member.adminNotes}</p>
                  </div>
                )}
                {saved && <p className="text-[11px] text-green-600 font-medium">Saved ✓</p>}
                <button onClick={() => setEditing(true)}
                  className="text-[11.5px] text-neutral-500 hover:text-neutral-800 underline underline-offset-2">
                  Edit all fields
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Edit membership</p>
                <div>
                  <label className="text-[11px] text-neutral-500 font-medium block mb-1">Status</label>
                  <select value={form.status || ''} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black">
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="inactive">Inactive</option>
                    <option value="past_due">Past due</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 font-medium block mb-1">Plan</label>
                  <select value={form.planOverride || ''} onChange={e => setForm(f => ({ ...f, planOverride: e.target.value }))}
                    className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black">
                    <option value="">— Select plan —</option>
                    {PLAN_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 font-medium block mb-1">Paid term</label>
                  <select value={form.paidTerm || ''} onChange={e => setForm(f => ({ ...f, paidTerm: e.target.value }))}
                    className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black">
                    <option value="">— Not set —</option>
                    <option value="1 month">1 month</option>
                    <option value="3 months">3 months</option>
                    <option value="6 months">6 months</option>
                    <option value="12 months">12 months</option>
                  </select>
                  <p className="text-[10.5px] text-neutral-400 mt-1">How long the member has paid for upfront.</p>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 font-medium block mb-1">Next billing / renewal date</label>
                  <input type="date" value={form.nextBillingDate || ''} onChange={e => setForm(f => ({ ...f, nextBillingDate: e.target.value }))}
                    className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black" />
                  <p className="text-[10.5px] text-neutral-400 mt-1">Set this to their actual Stripe billing date so the app shows it correctly.</p>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 font-medium block mb-1">Membership expiry date</label>
                  <div className="flex gap-2 items-center">
                    <input type="date" value={form.membershipEndDate || ''} onChange={e => setForm(f => ({ ...f, membershipEndDate: e.target.value }))}
                      className="flex-1 text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black" />
                    {form.membershipEndDate && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, membershipEndDate: '' }))}
                        className="h-9 px-2 text-[11px] text-neutral-400 hover:text-red-500 transition-colors" title="Clear expiry date">
                        ✕ Clear
                      </button>
                    )}
                  </div>
                  <p className="text-[10.5px] text-neutral-400 mt-1">For prepaid plans. Clear this if re-activating a member on a recurring plan — otherwise they&apos;ll be blocked from booking.</p>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 font-medium block mb-1">Classes remaining</label>
                  <input type="number" min={0} value={form.creditBalance ?? 0} onChange={e => setForm(f => ({ ...f, creditBalance: Number(e.target.value) }))}
                    className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black" />
                  <p className="text-[10.5px] text-neutral-400 mt-1">For class packs only. Decrements by 1 each time attendance is marked.</p>
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 font-medium block mb-1">Admin notes</label>
                  <textarea value={form.adminNotes || ''} onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))}
                    placeholder="Migration notes, special arrangements, payment history…"
                    rows={3}
                    className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black resize-none" />
                </div>
                {saveError && <p className="text-[11px] text-red-600">{saveError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={save} disabled={saving}
                    className="h-8 px-4 text-sm bg-black text-white rounded-lg disabled:opacity-40 hover:bg-neutral-800 transition-colors">
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="h-8 px-4 text-sm border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400 transition-colors">
                    Cancel
                  </button>
                </div>

                {/* Delete profile — destructive, separated visually */}
                <div className="pt-4 border-t border-neutral-100 mt-2">
                  {deleteError && (
                    <p className="text-[11px] text-red-600 mb-2">{deleteError}</p>
                  )}
                  {!deleteConfirm ? (
                    <button onClick={() => { setDeleteConfirm(true); setDeleteError('') }}
                      className="text-[11.5px] text-red-500 hover:text-red-700 underline underline-offset-2">
                      Delete profile
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[12px] text-neutral-700">Permanently delete this profile and all their data? This cannot be undone.</p>
                      <div className="flex gap-2">
                        <button onClick={deleteProfile} disabled={deleting}
                          className="h-8 px-4 text-sm bg-red-600 text-white rounded-lg disabled:opacity-40 hover:bg-red-700 transition-colors">
                          {deleting ? 'Deleting…' : 'Yes, delete'}
                        </button>
                        <button onClick={() => setDeleteConfirm(false)}
                          className="h-8 px-4 text-sm border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Reusable bits ─────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-neutral-100 rounded-lg px-4 py-3">
      <p className="text-[10.5px] text-neutral-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-semibold text-neutral-900 mt-0.5">{value}</p>
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

function ActionBtn({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-9 px-3 text-[12px] border border-neutral-200 rounded-lg text-neutral-600 hover:border-black hover:text-black transition-colors touch-manipulation"
    >
      {label}
    </button>
  )
}
