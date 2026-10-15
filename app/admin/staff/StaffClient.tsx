'use client'

import { useState } from 'react'
import type { Staff, Service, Session } from '@/lib/db'

type StaffRow = { id: string; name: string; email: string | null }

type Props = {
  staff:    Staff[]
  staffRows: StaffRow[]
  services: Service[]
  sessions: Session[]
}

function fmt12(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-AU', {
    timeZone: 'Australia/Melbourne',
    hour:     'numeric',
    minute:   '2-digit',
    hour12:   true,
  })
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

export default function StaffClient({ staff, staffRows, services, sessions }: Props) {
  const scheduleToService = Object.fromEntries(services.map(s => [s.scheduleId, s]))

  const [rows,     setRows]     = useState<StaffRow[]>(staffRows)
  const [showAdd,  setShowAdd]  = useState(false)
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [err,      setErr]      = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleAdd() {
    if (!name.trim()) { setErr('Name is required'); return }
    setSaving(true); setErr('')
    try {
      const res  = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed to add'); return }
      // Reload to get the new id
      const list = await fetch('/api/admin/staff').then(r => r.json())
      setRows(list.staff ?? [])
      setName(''); setEmail(''); setShowAdd(false)
    } catch { setErr('Network error. Please try again.') }
    finally   { setSaving(false) }
  }

  async function handleDelete(id: string, memberName: string) {
    if (!confirm(`Remove ${memberName} from the instructor list?`)) return
    setDeleting(id)
    try {
      await fetch('/api/admin/staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setRows(r => r.filter(s => s.id !== id))
    } finally { setDeleting(null) }
  }

  // Build combined staff list: staff table rows + session-derived names not in table
  const tableNameSet   = new Set(rows.map(r => r.name))
  const allStaffNames  = [
    ...rows.map(r => r.name),
    ...staff.filter(s => !tableNameSet.has(s.name)).map(s => s.name),
  ].sort()

  return (
    <div className="h-full overflow-y-auto bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Staff</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{allStaffNames.length} team member{allStaffNames.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => { setShowAdd(true); setErr('') }}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white text-[12px] font-medium rounded-lg hover:bg-neutral-700 transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add instructor
          </button>
        </div>

        {/* Add instructor modal */}
        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
              <h2 className="text-[15px] font-semibold text-neutral-900">Add instructor</h2>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Name *</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="e.g. Sarah Williams"
                    className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">Email (optional)</label>
                  <input
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="sarah@example.com"
                    type="email"
                    className="mt-1 w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
                {err && <p className="text-[12px] text-red-600">{err}</p>}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => { setShowAdd(false); setName(''); setEmail(''); setErr('') }}
                  className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm text-neutral-600 hover:bg-neutral-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-700 disabled:opacity-50"
                >
                  {saving ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}

        {allStaffNames.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl px-6 py-12 text-center">
            <p className="text-sm text-neutral-400">No instructors yet.</p>
            <p className="text-[12px] text-neutral-300 mt-1">Use the button above to add your first instructor.</p>
          </div>
        ) : (
          allStaffNames.map(memberName => {
            const tableRow      = rows.find(r => r.name === memberName)
            const staffMember   = staff.find(s => s.name === memberName)
            const memberSessions = sessions
              .filter(s => s.staffResourceId === staffMember?.resourceId && s.status !== 'CANCELLED')
              .sort((a, b) => a.start.localeCompare(b.start))

            const totalBooked   = memberSessions.reduce((n, s) => n + s.bookedCount, 0)
            const totalCapacity = memberSessions.reduce((n, s) => n + s.capacity, 0)

            return (
              <div key={memberName} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">

                {/* Member header */}
                <div className="px-6 py-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-neutral-900 text-white text-[13px] font-semibold flex items-center justify-center shrink-0">
                    {initials(memberName)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[15px] font-semibold text-neutral-900">{memberName}</h2>
                    {tableRow?.email && (
                      <p className="text-[12px] text-neutral-400 mt-0.5">{tableRow.email}</p>
                    )}
                    {!tableRow?.email && <p className="text-[12px] text-neutral-400 mt-0.5">Instructor</p>}
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-[10.5px] text-neutral-400 uppercase tracking-wider">Sessions this week</p>
                      <p className="text-xl font-semibold text-neutral-900 mt-0.5">{memberSessions.length}</p>
                    </div>
                    <div>
                      <p className="text-[10.5px] text-neutral-400 uppercase tracking-wider">Bookings</p>
                      <p className="text-xl font-semibold text-neutral-900 mt-0.5">
                        {totalBooked}
                        {totalCapacity > 0 && (
                          <span className="text-[13px] text-neutral-400 font-normal">/{totalCapacity}</span>
                        )}
                      </p>
                    </div>
                    {tableRow && (
                      <button
                        onClick={() => handleDelete(tableRow.id, memberName)}
                        disabled={deleting === tableRow.id}
                        className="text-[11px] text-neutral-400 hover:text-red-500 transition-colors ml-2"
                        title="Remove instructor"
                      >
                        {deleting === tableRow.id ? '…' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>

                {/* This week's sessions */}
                {memberSessions.length > 0 && (
                  <>
                    <div className="border-t border-neutral-100 px-6 py-2 bg-neutral-50">
                      <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">This week</span>
                    </div>
                    {memberSessions.map((s, i) => {
                      const svc  = scheduleToService[s.scheduleId]
                      const pct  = s.capacity > 0 ? Math.round((s.bookedCount / s.capacity) * 100) : 0
                      const full = s.bookedCount >= s.capacity
                      return (
                        <div
                          key={s.id}
                          className={`flex items-center gap-4 px-6 py-3 ${i < memberSessions.length - 1 ? 'border-b border-neutral-100' : ''}`}
                        >
                          <div className="w-28 shrink-0">
                            <p className="text-[11.5px] text-neutral-400">{fmtDay(s.start)}</p>
                            <p className="text-[11.5px] text-neutral-500 font-medium">{fmt12(s.start)}</p>
                          </div>
                          <span className="text-[13px] font-medium text-neutral-800 flex-1 truncate">
                            {svc?.name ?? s.title}
                          </span>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${full ? 'bg-red-400' : 'bg-black'}`}
                                style={{ width: `${Math.min(pct, 100)}%` }}
                              />
                            </div>
                            <span className={`text-[12px] font-semibold w-14 text-right ${full ? 'text-red-500' : 'text-neutral-700'}`}>
                              {s.bookedCount}/{s.capacity}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </>
                )}

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
