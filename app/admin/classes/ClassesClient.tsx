'use client'

import { useState } from 'react'

type TemplateRow = {
  id:         string
  day:        string
  start_time: string
  end_time:   string
  class_name: string
  instructor: string
}

const DAY_ORDER  = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

function fmt12(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const suffix = h >= 12 ? 'pm' : 'am'
  const h12    = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${suffix}`
}

const BLANK = { day: 'monday', start_time: '', end_time: '', class_name: '', instructor: '' }

export default function ClassesClient({ initialRows, instructors }: { initialRows: TemplateRow[]; instructors: string[] }) {
  const [rows,      setRows]      = useState<TemplateRow[]>(initialRows)
  const [saving,    setSaving]    = useState(false)
  const [error,     setError]     = useState('')

  // Add slot modal
  const [showAdd,   setShowAdd]   = useState(false)
  const [addForm,   setAddForm]   = useState({ ...BLANK })
  const [addError,  setAddError]  = useState('')
  const [adding,    setAdding]    = useState(false)

  // Edit slot modal
  const [editRow,   setEditRow]   = useState<TemplateRow | null>(null)
  const [editForm,  setEditForm]  = useState({ ...BLANK })
  const [editError, setEditError] = useState('')
  const [editing,   setEditing]   = useState(false)

  // Delete confirm
  const [delRow,    setDelRow]    = useState<TemplateRow | null>(null)
  const [deleting,  setDeleting]  = useState(false)

  // Dedup state
  const [deduping,  setDeduping]  = useState(false)
  const [syncing,   setSyncing]   = useState<string | null>(null)

  // Exact duplicates (same day+time+name) — safe to auto-remove
  const dupIds: string[] = (() => {
    const seen = new Set<string>()
    const dup: string[] = []
    for (const r of rows) {
      const key = `${r.day}|${r.start_time}|${r.class_name.toLowerCase().trim()}`
      if (seen.has(key)) dup.push(r.id)
      else seen.add(key)
    }
    return dup
  })()

  // Time-slot conflicts (same day+time, different class name) — need manual resolution
  const conflictTimes: string[] = (() => {
    const seen = new Set<string>()
    const conflicts = new Set<string>()
    for (const r of rows) {
      const key = `${r.day}|${r.start_time}`
      if (seen.has(key)) conflicts.add(key)
      else seen.add(key)
    }
    return Array.from(conflicts)
  })()

  function openEdit(row: TemplateRow) {
    setEditRow(row)
    setEditForm({ day: row.day, start_time: row.start_time, end_time: row.end_time, class_name: row.class_name, instructor: row.instructor })
    setEditError('')
  }

  function handleStartTime(time: string, form: typeof BLANK, setForm: (f: typeof BLANK) => void) {
    const endAlreadySet = form.end_time !== ''
    setForm({ ...form, start_time: time, ...(!endAlreadySet && time ? { end_time: addHour(time) } : {}) })
  }

  function addHour(hhmm: string) {
    const [h, m] = hhmm.split(':').map(Number)
    return `${String((h + 1) % 24).padStart(2,'0')}:${String(m).padStart(2,'0')}`
  }

  async function addSlot() {
    const { day, start_time, end_time, class_name, instructor } = addForm
    if (!start_time || !end_time || !class_name.trim()) { setAddError('Day, times and class name are required'); return }
    setAdding(true); setAddError('')
    const res  = await fetch('/api/admin/schedule-template', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day, start_time, end_time, class_name: class_name.trim(), instructor }),
    })
    const data = await res.json()
    if (!res.ok) { setAddError(data.error ?? 'Failed to add slot'); setAdding(false); return }
    setRows(prev => sortRows([...prev, data.row]))
    setShowAdd(false); setAddForm({ ...BLANK }); setAdding(false)
  }

  async function saveEdit() {
    if (!editRow) return
    const { day, start_time, end_time, class_name, instructor } = editForm
    if (!start_time || !end_time || !class_name.trim()) { setEditError('Times and class name are required'); return }
    setEditing(true); setEditError('')
    const res = await fetch('/api/admin/schedule-template', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editRow.id, day, start_time, end_time, class_name: class_name.trim(), instructor,
        old_day: editRow.day, old_start_time: editRow.start_time,
        old_end_time: editRow.end_time, old_class_name: editRow.class_name,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error ?? 'Failed to save'); setEditing(false); return }
    setRows(prev => sortRows(prev.map(r => r.id === editRow.id ? data.row : r)))
    setEditRow(null); setEditing(false)
  }

  async function deleteSlot() {
    if (!delRow) return
    setDeleting(true)
    const res = await fetch('/api/admin/schedule-template', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: delRow.id, day: delRow.day, start_time: delRow.start_time, class_name: delRow.class_name }),
    })
    if (!res.ok) { setDeleting(false); return }
    setRows(prev => prev.filter(r => r.id !== delRow.id))
    setDelRow(null); setDeleting(false)
  }

  async function resyncSlot(row: TemplateRow) {
    setSyncing(row.id)
    await fetch('/api/admin/schedule-template', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: row.id, day: row.day, start_time: row.start_time, end_time: row.end_time,
        class_name: row.class_name, instructor: row.instructor, resync: true,
      }),
    })
    setSyncing(null)
  }

  async function cleanDuplicates() {
    setDeduping(true)
    for (const id of dupIds) {
      const row = rows.find(r => r.id === id)
      if (!row) continue
      await fetch('/api/admin/schedule-template', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, day: row.day, start_time: row.start_time, class_name: row.class_name }),
      })
    }
    setRows(prev => {
      const seen = new Set<string>()
      return prev.filter(r => {
        const key = `${r.day}|${r.start_time}|${r.class_name.toLowerCase().trim()}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    })
    setDeduping(false)
  }

  function sortRows(r: TemplateRow[]) {
    return [...r].sort((a, b) => {
      const d = DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day)
      return d !== 0 ? d : a.start_time.localeCompare(b.start_time)
    })
  }

  const byDay = DAY_ORDER.reduce((acc, d) => {
    acc[d] = rows.filter(r => r.day === d)
    return acc
  }, {} as Record<string, TemplateRow[]>)

  function SlotForm({ form, setForm, err }: { form: typeof BLANK; setForm: (f: typeof BLANK) => void; err: string }) {
    return (
      <div className="space-y-3">
        <div>
          <label className="block text-[12px] font-medium text-neutral-600 mb-1">Day</label>
          <select value={form.day} onChange={e => setForm({ ...form, day: e.target.value })}
            className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black bg-white">
            {DAY_ORDER.map(d => <option key={d} value={d}>{DAY_LABELS[d]}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">Start time</label>
            <input type="time" value={form.start_time}
              onChange={e => handleStartTime(e.target.value, form, setForm)}
              className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black" />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-neutral-600 mb-1">End time</label>
            <input type="time" value={form.end_time}
              onChange={e => setForm({ ...form, end_time: e.target.value })}
              className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black" />
          </div>
        </div>
        <div>
          <label className="block text-[12px] font-medium text-neutral-600 mb-1">Class name</label>
          <input type="text" value={form.class_name} onChange={e => setForm({ ...form, class_name: e.target.value })}
            placeholder="e.g. Hot Mat Pilates"
            className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black" />
        </div>
        <div>
          <label className="block text-[12px] font-medium text-neutral-600 mb-1">Instructor</label>
          <select value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })}
            className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black bg-white">
            <option value="">— Unassigned —</option>
            {instructors.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {err && <p className="text-[12px] text-red-600">{err}</p>}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 md:px-6 py-4 border-b border-neutral-200 bg-white">
        <div>
          <h1 className="text-[15px] font-semibold text-neutral-900">Weekly schedule</h1>
          <p className="text-[12px] text-neutral-400 mt-0.5">{rows.length} recurring class{rows.length !== 1 ? 'es' : ''} · changes apply to all future sessions</p>
        </div>
        <button onClick={() => { setAddForm({ ...BLANK }); setAddError(''); setShowAdd(true) }}
          className="h-8 px-4 text-[14.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors touch-manipulation">
          + Add slot
        </button>
      </div>

      {/* Exact duplicate warning */}
      {dupIds.length > 0 && (
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 md:px-6 py-3 bg-amber-50 border-b border-amber-200">
          <p className="text-[12.5px] text-amber-800">
            {dupIds.length} exact duplicate{dupIds.length !== 1 ? 's' : ''} — same day, time and class name added more than once.
          </p>
          <button onClick={cleanDuplicates} disabled={deduping}
            className="shrink-0 h-9 px-3 text-[11.5px] font-medium bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-40 touch-manipulation self-start sm:self-auto">
            {deduping ? 'Cleaning…' : 'Remove duplicates'}
          </button>
        </div>
      )}

      {/* Time-slot conflict warning */}
      {conflictTimes.length > 0 && (
        <div className="shrink-0 px-4 md:px-6 py-3 bg-red-50 border-b border-red-200">
          <p className="text-[12.5px] text-red-800">
            {conflictTimes.length} time slot{conflictTimes.length !== 1 ? 's have' : ' has'} two different classes scheduled — delete the wrong one using ✕, then click <strong>Sync</strong> on the correct row to fix the live timetable.
          </p>
        </div>
      )}

      {/* Template list grouped by day */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-100">
        {DAY_ORDER.filter(d => byDay[d].length > 0).map(day => (
          <div key={day}>
            {/* Day heading */}
            <div className="px-4 md:px-6 pt-4 pb-1.5">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">{DAY_LABELS[day]}</span>
            </div>
            {/* Slots for this day */}
            {byDay[day].map(row => (
              <div key={row.id}
                className="flex items-center px-4 md:px-6 py-3 hover:bg-neutral-50 transition-colors group border-t border-neutral-50">
                {/* Time */}
                <div className="w-28 md:w-36 shrink-0">
                  <span className="text-[12px] md:text-[13px] font-medium text-neutral-800">{fmt12(row.start_time)}</span>
                  <span className="hidden md:inline text-[12px] text-neutral-400"> – {fmt12(row.end_time)}</span>
                </div>
                {/* Class name */}
                <div className="flex-1 min-w-0 px-2 md:px-3">
                  <span className="text-[13px] md:text-[14px] text-neutral-900">{row.class_name}</span>
                  {/* Instructor — mobile only, shown below class name */}
                  {row.instructor && (
                    <p className="md:hidden text-[11px] text-neutral-400 mt-0.5">{row.instructor}</p>
                  )}
                </div>
                {/* Instructor — desktop only */}
                <div className="w-28 shrink-0 hidden md:block">
                  <span className="text-[13px] text-neutral-500">{row.instructor || '—'}</span>
                </div>
                {/* Actions — always visible on mobile, hover on desktop */}
                <div className="flex items-center gap-1.5 shrink-0 md:opacity-0 md:group-hover:opacity-100 md:transition-opacity">
                  <button onClick={() => resyncSlot(row)} disabled={syncing === row.id}
                    title="Force sessions to match this template row (fixes wrong class names)"
                    className="hidden md:flex h-7 px-3 text-[11.5px] font-medium border border-neutral-200 rounded-lg text-neutral-600 hover:border-blue-400 hover:text-blue-700 disabled:opacity-40 touch-manipulation items-center">
                    {syncing === row.id ? '…' : 'Sync'}
                  </button>
                  <button onClick={() => openEdit(row)}
                    className="h-9 md:h-7 px-3 text-[12px] md:text-[11.5px] font-medium border border-neutral-200 rounded-lg text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 touch-manipulation flex items-center">
                    Edit
                  </button>
                  <button onClick={() => setDelRow(row)}
                    className="h-9 w-9 md:h-7 md:w-7 flex items-center justify-center text-neutral-300 hover:text-red-500 transition-colors text-sm touch-manipulation">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {rows.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-neutral-400">
            No classes yet. Click &ldquo;+ Add slot&rdquo; to build the weekly schedule.
          </div>
        )}
      </div>

      {/* ── Add slot modal ──────────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowAdd(false)} />
          <div className="relative bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full md:w-[420px] p-6 pb-8 md:pb-6">
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">Add recurring slot</h2>
            <SlotForm form={addForm} setForm={setAddForm} err={addError} />
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setShowAdd(false)}
                className="h-8 px-4 text-[14.5px] text-neutral-600 border border-neutral-200 rounded-lg hover:border-neutral-400 touch-manipulation">
                Cancel
              </button>
              <button onClick={addSlot} disabled={adding}
                className="h-8 px-4 text-[14.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 touch-manipulation">
                {adding ? 'Adding…' : 'Add slot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit slot modal ─────────────────────────────────────────────────── */}
      {editRow && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditRow(null)} />
          <div className="relative bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full md:w-[420px] p-6 pb-8 md:pb-6">
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-1">Edit slot</h2>
            <p className="text-[12px] text-neutral-400 mb-4">Changes apply to all future matching sessions</p>
            <SlotForm form={editForm} setForm={setEditForm} err={editError} />
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={() => setEditRow(null)}
                className="h-8 px-4 text-[14.5px] text-neutral-600 border border-neutral-200 rounded-lg hover:border-neutral-400 touch-manipulation">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={editing}
                className="h-8 px-4 text-[14.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 touch-manipulation">
                {editing ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ────────────────────────────────────────────── */}
      {delRow && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setDelRow(null)} />
          <div className="relative bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full md:w-[380px] p-6 pb-8 md:pb-6">
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-2">Remove slot?</h2>
            <p className="text-[13px] text-neutral-600 mb-1">
              <strong>{DAY_LABELS[delRow.day]}</strong> {fmt12(delRow.start_time)} · {delRow.class_name}
            </p>
            <p className="text-[12px] text-neutral-400 mb-5">
              All future sessions for this slot will be cancelled. Sessions with existing bookings are not affected.
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDelRow(null)}
                className="h-8 px-4 text-[14.5px] text-neutral-600 border border-neutral-200 rounded-lg hover:border-neutral-400 touch-manipulation">
                Cancel
              </button>
              <button onClick={deleteSlot} disabled={deleting}
                className="h-8 px-4 text-[14.5px] font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-40 touch-manipulation">
                {deleting ? 'Removing…' : 'Remove slot'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
