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
                <div className="w-36 shrink-0">
                  <span className="text-[13px] font-medium text-neutral-800">{fmt12(row.start_time)}</span>
                  <span className="text-[12px] text-neutral-400"> – {fmt12(row.end_time)}</span>
                </div>
                {/* Class name */}
                <div className="flex-1 min-w-0 px-3">
                  <span className="text-[14px] text-neutral-900">{row.class_name}</span>
                </div>
                {/* Instructor */}
                <div className="w-28 shrink-0 hidden md:block">
                  <span className="text-[13px] text-neutral-500">{row.instructor || '—'}</span>
                </div>
                {/* Actions — visible on hover */}
                <div className="flex items-center gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(row)}
                    className="h-7 px-3 text-[11.5px] font-medium border border-neutral-200 rounded-lg text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 touch-manipulation">
                    Edit
                  </button>
                  <button onClick={() => setDelRow(row)}
                    className="h-7 w-7 flex items-center justify-center text-neutral-300 hover:text-red-500 transition-colors text-sm touch-manipulation">
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
