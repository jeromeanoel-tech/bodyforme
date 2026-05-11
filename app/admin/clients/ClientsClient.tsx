'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import type { WixContact, WixContactBooking, WixMembership, MemberCredential } from '@/lib/wix'
import { useSettings } from '@/lib/useSettings'

type Props = {
  contacts: WixContact[]
  membershipsByContact: Record<string, WixMembership[]>
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

function fmtDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }) +
    ' · ' +
    d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
  )
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

function activeMembership(mems: WixMembership[]): WixMembership | undefined {
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

function applyFilter(key: FilterKey, contact: WixContact, mems: WixMembership[], newMemberDays: number): boolean {
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
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState<SortKey>('name-asc')
  const [cols, setCols]         = useState<ColKey[]>(['email', 'phone', 'since', 'membership'])
  const [filters, setFilters]   = useState<FilterKey[]>([])
  const [colsOpen, setColsOpen]     = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selected, setSelected]     = useState<WixContact | null>(null)
  const [menuId, setMenuId]         = useState<string | null>(null)
  const { settings } = useSettings()
  const newMemberDays = settings.newMemberDays

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
    '2fr',
    ...ALL_COLS.filter(c => cols.includes(c.key)).map(c => c.width),
    '48px',
  ].join(' ')

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

      {/* ── Toolbar ── */}
      <div className="shrink-0 px-6 py-3 border-b border-neutral-200 bg-white">
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
            <button className="h-8 px-3 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors font-medium whitespace-nowrap">
              + New Client
            </button>
          </div>
        </div>
      </div>

      {/* ── Table header ── */}
      <div
        className="shrink-0 grid px-6 py-2 border-b border-neutral-200 bg-neutral-50"
        style={{ gridTemplateColumns: gridCols }}
      >
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

            return (
              <div
                key={contact.id}
                className="grid items-center px-6 py-3 border-b border-neutral-100 hover:bg-neutral-50 transition-colors cursor-pointer"
                style={{ gridTemplateColumns: gridCols }}
                onClick={() => setSelected(contact)}
              >
                {/* Name */}
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
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${MEM_STATUS_BADGE[mem.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                        {mem.status === 'ENDED' ? 'Expired' : mem.status === 'CANCELED' ? 'Cancelled' : mem.status.charAt(0) + mem.status.slice(1).toLowerCase()}
                      </span>
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
            )
          })
        )}
      </div>

      {/* ── Footer ── */}
      <div className="px-6 py-5 border-t border-neutral-200 bg-white flex items-center gap-8">
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
        />
      )}
    </div>
  )
}

// ── Row context menu ──────────────────────────────────────────────────────────

function RowMenu({
  contact, open, onOpen, onClose, onViewProfile,
}: {
  contact: WixContact
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
          <MenuItem label="Book a class"  onClick={onClose} muted />
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
  contact, memberships, newMemberDays, onClose,
}: {
  contact: WixContact
  memberships: WixMembership[]
  newMemberDays: number
  onClose: () => void
}) {
  const [bookings, setBookings]   = useState<WixContactBooking[] | null>(null)
  const [loading, setLoading]     = useState(false)
  const [tab, setTab]             = useState<DrawerTab>('overview')
  const [note, setNote]           = useState('')
  const [notes, setNotes]         = useState<{ text: string; date: string }[]>([])
  const [member, setMember]       = useState<MemberCredential | null | undefined>(undefined)
  const [memberLoading, setMemberLoading] = useState(false)

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

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[420px] bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200">

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
                  {activeMem
                    ? <>{activeMem.planName} · <span className={`font-medium ${activeMem.status === 'ACTIVE' ? 'text-neutral-800' : 'text-neutral-400'}`}>{activeMem.status.charAt(0) + activeMem.status.slice(1).toLowerCase()}</span></>
                    : 'No active membership'
                  }
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl mt-0.5">×</button>
          </div>
          <div className="flex gap-2 mt-4">
            <ActionBtn label="Book class" />
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
            <>
              <div className="grid grid-cols-2 gap-3 px-6 py-4 border-b border-neutral-100">
                <StatCard label="Total bookings"   value={loading ? '—' : String(totalBookings)} />
                <StatCard label="Classes attended" value={loading ? '—' : String(attended)} />
                <StatCard label="Cancellations"    value={loading ? '—' : String(cancelled)} />
                <StatCard label="Last visit"        value={loading ? '—' : fmtDate(lastVisit)} />
              </div>
              <div className="px-6 py-4 space-y-3">
                <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Contact</p>
                <InfoRow label="Email" value={contact.email || '—'} />
                <InfoRow label="Phone" value={contact.phone || '—'} />
                <InfoRow label="Member since" value={fmtDate(contact.createdDate)} />
              </div>
            </>
          )}

          {/* Bookings */}
          {tab === 'bookings' && (
            <>
              {loading && <p className="px-6 py-6 text-sm text-neutral-400">Loading bookings…</p>}
              {!loading && bookings?.length === 0 && <p className="px-6 py-6 text-sm text-neutral-400">No bookings found.</p>}
              {bookings?.map((b, i) => (
                <div key={b.id} className={`flex items-center justify-between px-6 py-3.5 ${i < bookings.length - 1 ? 'border-b border-neutral-100' : ''}`}>
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

// ── Memberships tab ───────────────────────────────────────────────────────────

const PLAN_OPTIONS = ['Bronze – $120/mo', 'Silver – $200/mo', 'Unlimited – $260/mo', '5-Class Pack', '10-Class Pack', 'Casual Drop-in', 'Free Trial']
const STATUS_OPTIONS = ['active', 'paused', 'cancelled', 'pending']

function MembershipsTab({ contact, memberships, member, memberLoading, onMemberUpdate }: {
  contact:        WixContact
  memberships:    WixMembership[]
  member:         MemberCredential | null | undefined
  memberLoading:  boolean
  onMemberUpdate: (m: MemberCredential) => void
}) {
  const [form, setForm]     = useState<Partial<MemberCredential>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (member) setForm({
      status:          member.status,
      planOverride:    member.planOverride    || '',
      nextBillingDate: member.nextBillingDate || '',
      creditBalance:   member.creditBalance   ?? 0,
      adminNotes:      member.adminNotes      || '',
    })
  }, [member])

  async function save() {
    setSaving(true)
    await fetch('/api/admin/update-member', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId: contact.id, ...form }),
    })
    setSaving(false)
    setSaved(true)
    setEditing(false)
    if (member) onMemberUpdate({ ...member, ...form } as MemberCredential)
    setTimeout(() => setSaved(false), 2000)
  }

  const stripeUrl = member?.stripeCustomerId
    ? `https://dashboard.stripe.com/customers/${member.stripeCustomerId}`
    : null

  return (
    <div>
      {/* Wix memberships (read-only) */}
      {memberships.length > 0 && (
        <div className="border-b border-neutral-100">
          <p className="px-6 pt-4 pb-2 text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Wix membership history</p>
          {memberships
            .sort((a, b) => b.startDate.localeCompare(a.startDate))
            .map((m, i) => (
              <div key={m.id} className={`flex items-start justify-between px-6 py-3.5 ${i < memberships.length - 1 ? 'border-b border-neutral-100' : ''}`}>
                <div>
                  <p className="text-[13px] font-semibold text-neutral-900">{m.planName || '—'}</p>
                  <p className="text-[11.5px] text-neutral-400 mt-0.5">
                    Started {fmtDate(m.startDate)}{m.endDate ? ` · Ends ${fmtDate(m.endDate)}` : ''}
                  </p>
                </div>
                <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${MEM_STATUS_BADGE[m.status] ?? 'bg-neutral-100 text-neutral-500'}`}>
                  {m.status === 'ENDED' ? 'Expired' : m.status === 'CANCELED' ? 'Cancelled' : m.status.charAt(0) + m.status.slice(1).toLowerCase()}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* Admin override panel */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Admin adjustment</p>
          <div className="flex items-center gap-2">
            {stripeUrl && (
              <a
                href={stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Open in Stripe ↗
              </a>
            )}
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-[11px] font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 px-2.5 py-1 rounded-md"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        {memberLoading && <p className="text-sm text-neutral-400">Loading…</p>}

        {!memberLoading && !member && (
          <p className="text-[12px] text-neutral-400 italic">No app account found for this contact. They haven&apos;t signed up via the member portal yet.</p>
        )}

        {!memberLoading && member && !editing && (
          <div className="space-y-2.5">
            <InfoRow label="Status"         value={member.status || '—'} />
            <InfoRow label="Plan override"  value={member.planOverride || '—'} />
            <InfoRow label="Next billing"   value={member.nextBillingDate ? fmtDate(member.nextBillingDate) : '—'} />
            <InfoRow label="Credit balance" value={member.creditBalance ? `${member.creditBalance} classes` : '—'} />
            {member.adminNotes && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                <p className="text-[11.5px] text-amber-800 whitespace-pre-wrap">{member.adminNotes}</p>
              </div>
            )}
            {saved && <p className="text-[11px] text-green-600 font-medium">Saved ✓</p>}
          </div>
        )}

        {!memberLoading && member && editing && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-neutral-500 font-medium block mb-1">Status</label>
              <select
                value={form.status || ''}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black"
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 font-medium block mb-1">Plan</label>
              <select
                value={form.planOverride || ''}
                onChange={e => setForm(f => ({ ...f, planOverride: e.target.value }))}
                className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black"
              >
                <option value="">— Select plan —</option>
                {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 font-medium block mb-1">Next billing date</label>
              <input
                type="date"
                value={form.nextBillingDate || ''}
                onChange={e => setForm(f => ({ ...f, nextBillingDate: e.target.value }))}
                className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 font-medium block mb-1">Credit balance (classes remaining from Mind Body)</label>
              <input
                type="number"
                min={0}
                value={form.creditBalance ?? 0}
                onChange={e => setForm(f => ({ ...f, creditBalance: Number(e.target.value) }))}
                className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="text-[11px] text-neutral-500 font-medium block mb-1">Admin notes</label>
              <textarea
                value={form.adminNotes || ''}
                onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))}
                placeholder="Migration notes, special arrangements, etc."
                rows={3}
                className="w-full text-[13px] border border-neutral-200 rounded-lg px-3 py-2 outline-none focus:border-black resize-none"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={save}
                disabled={saving}
                className="h-8 px-4 text-sm bg-black text-white rounded-lg disabled:opacity-40 hover:bg-neutral-800 transition-colors"
              >
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="h-8 px-4 text-sm border border-neutral-200 text-neutral-600 rounded-lg hover:border-neutral-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
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
      className="h-7 px-3 text-[12px] border border-neutral-200 rounded-lg text-neutral-600 hover:border-black hover:text-black transition-colors"
    >
      {label}
    </button>
  )
}
