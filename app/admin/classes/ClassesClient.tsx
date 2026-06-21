'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Service = {
  id: string
  name: string
  description: string
  duration: number
  capacity: number
  upcomingSessions: number
}

type Session = {
  id: string
  title: string
  instructor_name: string
  start_time: string
  end_time: string
  capacity: number
  status: string
}

function fmt(iso: string) {
  // Sessions are stored as naive Melbourne time in UTC — read the raw digits, don't convert
  const naive = iso.slice(0, 16)           // '2026-06-22T09:30'
  const [dateStr, timeStr] = naive.split('T')
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const h12  = h % 12 || 12
  // Parse the date at noon to avoid any DST edge-case flipping the day
  const d = new Date(dateStr + 'T12:00:00')
  const day = d.toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
  return `${day}, ${h12}:${m.toString().padStart(2, '0')}${ampm}`
}

export default function ClassesClient({ initialServices, instructors }: { initialServices: Service[]; instructors: string[] }) {
  const router = useRouter()
  const [services,   setServices]   = useState<Service[]>(initialServices)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [sessions,   setSessions]   = useState<Record<string, Session[]>>({})
  const [loadingId,  setLoadingId]  = useState<string | null>(null)

  const [showNewClass,   setShowNewClass]   = useState(false)
  const [newName,        setNewName]        = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newDuration,    setNewDuration]    = useState(60)
  const [newCapacity,    setNewCapacity]    = useState(25)
  const [savingClass,    setSavingClass]    = useState(false)
  const [classError,     setClassError]     = useState('')

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deletingId,      setDeletingId]      = useState<string | null>(null)
  const [deleteError,     setDeleteError]     = useState<string>('')

  const [editClassId,     setEditClassId]     = useState<string | null>(null)
  const [editName,        setEditName]        = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDuration,    setEditDuration]    = useState(60)
  const [editCapacity,    setEditCapacity]    = useState(25)
  const [savingEdit,      setSavingEdit]      = useState(false)
  const [editError,       setEditError]       = useState('')

  const [addSessionFor,    setAddSessionFor]    = useState<Service | null>(null)
  const [sessionDate,      setSessionDate]      = useState('')
  const [sessionStartTime, setSessionStartTime] = useState('')
  const [sessionEndTime,   setSessionEndTime]   = useState('')
  const [sessionInstructor, setSessionInstructor] = useState('')
  const [sessionCapacity,  setSessionCapacity]  = useState(25)
  const [sessionRepeatWeekly, setSessionRepeatWeekly] = useState(false)
  const [sessionRepeatWeeks,  setSessionRepeatWeeks]  = useState(52)
  const [savingSession,    setSavingSession]    = useState(false)
  const [sessionError,     setSessionError]     = useState('')

  const [deletingSessionId,   setDeletingSessionId]   = useState<string | null>(null)
  const [editInstructorId,    setEditInstructorId]    = useState<string | null>(null)
  const [editInstructorVal,   setEditInstructorVal]   = useState('')
  const [savingInstructor,    setSavingInstructor]    = useState(false)

  async function loadSessions(serviceId: string) {
    setLoadingId(serviceId)
    const res  = await fetch(`/api/admin/sessions?serviceId=${serviceId}`)
    const data = await res.json()
    setSessions(prev => ({ ...prev, [serviceId]: data.sessions ?? [] }))
    setLoadingId(null)
  }

  function toggleExpand(service: Service) {
    if (expandedId === service.id) {
      setExpandedId(null)
    } else {
      setExpandedId(service.id)
      if (!sessions[service.id]) loadSessions(service.id)
    }
  }

  async function createClass() {
    if (!newName.trim()) { setClassError('Class name is required'); return }
    setSavingClass(true)
    setClassError('')
    const res  = await fetch('/api/admin/classes', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ name: newName.trim(), description: newDescription, duration: newDuration, capacity: newCapacity }),
    })
    const data = await res.json()
    if (!res.ok) { setClassError(data.error ?? 'Failed to create class'); setSavingClass(false); return }
    setServices(prev => [...prev, { id: data.id, name: newName.trim(), description: newDescription, duration: newDuration, capacity: newCapacity, upcomingSessions: 0 }].sort((a, b) => a.name.localeCompare(b.name)))
    setShowNewClass(false)
    setNewName('')
    setNewDescription('')
    setNewDuration(60)
    setNewCapacity(10)
    setSavingClass(false)
    router.refresh()
  }

  async function deleteClass(id: string) {
    setDeletingId(id)
    setDeleteError('')
    const res  = await fetch('/api/admin/classes', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    if (!res.ok) {
      const data = await res.json()
      setDeleteError(data.error ?? 'Failed to delete class')
      setDeleteConfirmId(null)
      setDeletingId(null)
      return
    }
    setServices(prev => prev.filter(s => s.id !== id))
    setSessions(prev => { const next = { ...prev }; delete next[id]; return next })
    if (expandedId === id) setExpandedId(null)
    setDeleteConfirmId(null)
    setDeletingId(null)
    router.refresh()
  }

  function openEditClass(service: Service) {
    setEditClassId(service.id)
    setEditName(service.name)
    setEditDescription(service.description)
    setEditDuration(service.duration)
    setEditCapacity(service.capacity)
    setEditError('')
  }

  async function saveEditClass() {
    if (!editName.trim()) { setEditError('Class name is required'); return }
    setSavingEdit(true)
    setEditError('')
    const res  = await fetch('/api/admin/classes', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: editClassId, name: editName.trim(), description: editDescription, duration: editDuration, capacity: editCapacity }),
    })
    const data = await res.json()
    if (!res.ok) { setEditError(data.error ?? 'Failed to save'); setSavingEdit(false); return }
    setServices(prev => prev.map(s => s.id === editClassId
      ? { ...s, name: editName.trim(), description: editDescription, duration: editDuration, capacity: editCapacity }
      : s
    ))
    setEditClassId(null)
    setSavingEdit(false)
    router.refresh()
  }

  function openAddSession(service: Service) {
    setAddSessionFor(service)
    setSessionDate('')
    setSessionStartTime('')
    setSessionEndTime('')
    setSessionInstructor('')
    setSessionCapacity(service.capacity)
    setSessionRepeatWeekly(false)
    setSessionRepeatWeeks(52)
    setSessionError('')
  }

  function handleStartTimeChange(time: string) {
    setSessionStartTime(time)
    if (time && addSessionFor) {
      const [h, m] = time.split(':').map(Number)
      const end    = new Date(2000, 0, 1, h, m + addSessionFor.duration)
      const hh     = end.getHours().toString().padStart(2, '0')
      const mm     = end.getMinutes().toString().padStart(2, '0')
      setSessionEndTime(`${hh}:${mm}`)
    }
  }

  async function createSession() {
    if (!sessionDate || !sessionStartTime || !sessionEndTime) {
      setSessionError('Date, start time and end time are required')
      return
    }
    setSavingSession(true)
    setSessionError('')

    const pad = (n: number) => n.toString().padStart(2, '0')
    const fmtLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`

    if (sessionRepeatWeekly) {
      const sessions = Array.from({ length: sessionRepeatWeeks }, (_, i) => {
        const s = new Date(`${sessionDate}T${sessionStartTime}:00`)
        const e = new Date(`${sessionDate}T${sessionEndTime}:00`)
        s.setDate(s.getDate() + i * 7)
        e.setDate(e.getDate() + i * 7)
        return { startTime: fmtLocal(s), endTime: fmtLocal(e) }
      })
      const res = await fetch('/api/admin/sessions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sessions,
          serviceId:      addSessionFor!.id,
          serviceName:    addSessionFor!.name,
          instructorName: sessionInstructor,
          capacity:       sessionCapacity,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSessionError(data.error ?? 'Failed to add sessions'); setSavingSession(false); return }
      setServices(prev => prev.map(s => s.id === addSessionFor!.id ? { ...s, upcomingSessions: s.upcomingSessions + sessionRepeatWeeks } : s))
      await loadSessions(addSessionFor!.id)
      setSessionDate('')
      setSessionStartTime('')
      setSessionEndTime('')
      setSessionRepeatWeekly(false)
      setSavingSession(false)
      router.refresh()
    } else {
      const startTime = fmtLocal(new Date(`${sessionDate}T${sessionStartTime}:00`))
      const endTime   = fmtLocal(new Date(`${sessionDate}T${sessionEndTime}:00`))
      const res = await fetch('/api/admin/sessions', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          serviceId:      addSessionFor!.id,
          serviceName:    addSessionFor!.name,
          instructorName: sessionInstructor,
          startTime,
          endTime,
          capacity:       sessionCapacity,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSessionError(data.error ?? 'Failed to add session'); setSavingSession(false); return }
      const newSession: Session = {
        id:              data.id,
        title:           addSessionFor!.name,
        instructor_name: sessionInstructor,
        start_time:      startTime,
        end_time:        endTime,
        capacity:        sessionCapacity,
        status:          'CONFIRMED',
      }
      setSessions(prev => ({
        ...prev,
        [addSessionFor!.id]: [...(prev[addSessionFor!.id] ?? []), newSession].sort((a, b) => a.start_time.localeCompare(b.start_time)),
      }))
      setServices(prev => prev.map(s => s.id === addSessionFor!.id ? { ...s, upcomingSessions: s.upcomingSessions + 1 } : s))
      setSessionDate('')
      setSessionStartTime('')
      setSessionEndTime('')
      setSavingSession(false)
      router.refresh()
    }
  }

  async function saveInstructor(serviceId: string, sessionId: string) {
    setSavingInstructor(true)
    await fetch('/api/admin/sessions', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: sessionId, instructorName: editInstructorVal }),
    })
    setSessions(prev => ({
      ...prev,
      [serviceId]: (prev[serviceId] ?? []).map(s =>
        s.id === sessionId ? { ...s, instructor_name: editInstructorVal } : s
      ),
    }))
    setEditInstructorId(null)
    setSavingInstructor(false)
  }

  async function deleteSession(serviceId: string, sessionId: string) {
    setDeletingSessionId(sessionId)
    await fetch('/api/admin/sessions', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id: sessionId }),
    })
    setSessions(prev => ({ ...prev, [serviceId]: (prev[serviceId] ?? []).filter(s => s.id !== sessionId) }))
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, upcomingSessions: Math.max(0, s.upcomingSessions - 1) } : s))
    setDeletingSessionId(null)
    router.refresh()
  }

  // Shared action buttons (used by both mobile and desktop variants of each service row)
  function ActionButtons({ service }: { service: Service }) {
    return (
      <>
        <button
          onClick={e => { e.stopPropagation(); openAddSession(service) }}
          className="h-7 px-3 text-[11.5px] font-medium border border-neutral-200 rounded-lg text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors touch-manipulation"
        >
          + Session
        </button>
        <button
          onClick={e => { e.stopPropagation(); openEditClass(service) }}
          className="h-7 px-3 text-[11.5px] font-medium border border-neutral-200 rounded-lg text-neutral-600 hover:border-neutral-400 hover:text-neutral-900 transition-colors touch-manipulation"
          title="Edit class"
        >
          Edit
        </button>
        {deleteConfirmId === service.id ? (
          <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
            <span className="text-[11px] text-neutral-500">Delete all?</span>
            <button
              onClick={() => deleteClass(service.id)}
              disabled={deletingId === service.id}
              className="h-6 px-2.5 text-[11px] font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-40 touch-manipulation"
            >
              {deletingId === service.id ? '…' : 'Yes'}
            </button>
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="h-6 px-2 text-[11px] text-neutral-500 hover:text-neutral-800 touch-manipulation"
            >
              No
            </button>
          </div>
        ) : (
          <button
            onClick={e => { e.stopPropagation(); setDeleteError(''); setDeleteConfirmId(service.id) }}
            className="h-7 w-7 flex items-center justify-center text-neutral-300 hover:text-red-500 transition-colors text-sm touch-manipulation"
            title="Delete class"
          >
            ✕
          </button>
        )}
      </>
    )
  }

  return (
    <div className="h-full flex flex-col">

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 md:px-6 py-4 border-b border-neutral-200 bg-white">
        <div>
          <h1 className="text-[15px] font-semibold text-neutral-900">Classes</h1>
          <p className="text-[12px] text-neutral-400 mt-0.5">{services.length} class type{services.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowNewClass(true)}
          className="h-8 px-4 text-[14.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors touch-manipulation"
        >
          + New class
        </button>
      </div>

      {/* Delete error banner */}
      {deleteError && (
        <div className="shrink-0 px-4 md:px-6 py-2.5 bg-red-50 border-b border-red-200 flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-red-700">{deleteError}</p>
          <button onClick={() => setDeleteError('')} className="text-red-400 hover:text-red-600 text-sm shrink-0">✕</button>
        </div>
      )}

      {/* Class list */}
      <div className="flex-1 overflow-y-auto">
        {services.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-neutral-400">
            No classes yet. Click &quot;New class&quot; to add one.
          </div>
        )}

        {services.map(service => (
          <div key={service.id} className="border-b border-neutral-100">

            {/* ── Desktop service row (unchanged from original) ── */}
            <div
              className="hidden md:flex items-center px-6 py-4 hover:bg-neutral-50 cursor-pointer transition-colors"
              onClick={() => toggleExpand(service)}
            >
              <div className="w-5 h-5 rounded bg-black shrink-0 mr-3" />
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-medium text-neutral-900">{service.name}</p>
                <p className="text-[14.5px] text-neutral-400 mt-0.5">
                  {service.duration} min · {service.capacity} capacity
                  {service.description ? ` · ${service.description}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-3 ml-4 shrink-0" onClick={e => e.stopPropagation()}>
                <span className="text-[12px] text-neutral-500">{service.upcomingSessions} upcoming</span>
                <ActionButtons service={service} />
              </div>
              <span className={`text-neutral-400 text-xs transition-transform ml-3 shrink-0 ${expandedId === service.id ? 'rotate-180' : ''}`}>▼</span>
            </div>

            {/* ── Mobile service row ── */}
            <div
              className="md:hidden px-4 py-4 hover:bg-neutral-50 cursor-pointer transition-colors"
              onClick={() => toggleExpand(service)}
            >
              {/* Top line: icon + name + chevron */}
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded bg-black shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-neutral-900 truncate">{service.name}</p>
                  <p className="text-[12px] text-neutral-400 mt-0.5">
                    {service.duration} min · cap {service.capacity}
                    {service.upcomingSessions > 0 ? ` · ${service.upcomingSessions} upcoming` : ''}
                  </p>
                </div>
                <span className={`text-neutral-400 text-xs transition-transform shrink-0 ${expandedId === service.id ? 'rotate-180' : ''}`}>▼</span>
              </div>
              {/* Action buttons below */}
              <div className="flex items-center gap-2 mt-2.5 ml-8" onClick={e => e.stopPropagation()}>
                <ActionButtons service={service} />
              </div>
            </div>

            {/* Expanded sessions */}
            {expandedId === service.id && (
              <div className="bg-neutral-50 border-t border-neutral-100">
                {loadingId === service.id ? (
                  <div className="px-8 py-4 text-[12px] text-neutral-400">Loading sessions…</div>
                ) : (sessions[service.id] ?? []).length === 0 ? (
                  <div className="px-8 py-4 text-[12px] text-neutral-400">
                    No sessions scheduled. Click &quot;+ Session&quot; to add one.
                  </div>
                ) : (
                  <>
                    {/* ── Mobile: session cards ── */}
                    <div className="md:hidden divide-y divide-neutral-100">
                      {(sessions[service.id] ?? []).map(session => (
                        <div key={session.id} className="px-4 py-3">
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-medium text-neutral-800 leading-snug">{fmt(session.start_time)}</p>
                              {/* Instructor inline edit */}
                              {editInstructorId === session.id ? (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <select
                                    value={editInstructorVal}
                                    onChange={e => setEditInstructorVal(e.target.value)}
                                    className="flex-1 h-8 px-2 text-[12px] border border-neutral-300 rounded-lg outline-none focus:border-black bg-white"
                                    autoFocus
                                  >
                                    <option value="">— Unassigned —</option>
                                    {instructors.map(n => <option key={n} value={n}>{n}</option>)}
                                  </select>
                                  <button
                                    onClick={() => saveInstructor(service.id, session.id)}
                                    disabled={savingInstructor}
                                    className="h-8 px-2.5 text-[12px] font-medium bg-black text-white rounded-lg disabled:opacity-40 touch-manipulation"
                                  >
                                    {savingInstructor ? '…' : '✓'}
                                  </button>
                                  <button
                                    onClick={() => setEditInstructorId(null)}
                                    className="h-8 px-2 text-[12px] text-neutral-400 touch-manipulation"
                                  >✕</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setEditInstructorId(session.id); setEditInstructorVal(session.instructor_name || '') }}
                                  className="flex items-center gap-1 mt-1 touch-manipulation"
                                >
                                  <span className="text-[11.5px] text-neutral-500">
                                    {session.instructor_name || 'Unassigned'} · Cap {session.capacity}
                                  </span>
                                  <span className="text-[10px] text-neutral-300">✏</span>
                                </button>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 mt-0.5">
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                session.status === 'CANCELLED'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}>
                                {session.status === 'CANCELLED' ? 'Cancelled' : 'Active'}
                              </span>
                              <button
                                onClick={() => deleteSession(service.id, session.id)}
                                disabled={deletingSessionId === session.id}
                                className="w-7 h-7 flex items-center justify-center text-neutral-300 hover:text-red-500 transition-colors disabled:opacity-40 touch-manipulation"
                                title="Delete session"
                              >
                                {deletingSessionId === session.id ? '…' : '✕'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* ── Desktop: original grid table ── */}
                    <div className="hidden md:block">
                      <div className="grid px-8 py-2 border-b border-neutral-200" style={{ gridTemplateColumns: '1fr 200px 80px 80px 40px' }}>
                        <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Date & Time</span>
                        <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Instructor</span>
                        <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Capacity</span>
                        <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider">Status</span>
                        <span />
                      </div>
                      {(sessions[service.id] ?? []).map(session => (
                        <div
                          key={session.id}
                          className="grid items-center px-8 py-3 border-b border-neutral-100 last:border-0"
                          style={{ gridTemplateColumns: '1fr 200px 80px 80px 40px' }}
                        >
                          <span className="text-[14.5px] text-neutral-700">{fmt(session.start_time)}</span>
                          {/* Instructor — click to edit */}
                          {editInstructorId === session.id ? (
                            <div className="flex items-center gap-1.5 pr-2">
                              <select
                                value={editInstructorVal}
                                onChange={e => setEditInstructorVal(e.target.value)}
                                className="flex-1 h-7 px-2 text-[12px] border border-neutral-300 rounded-lg outline-none focus:border-black bg-white"
                                autoFocus
                                onClick={e => e.stopPropagation()}
                              >
                                <option value="">— Unassigned —</option>
                                {instructors.map(n => <option key={n} value={n}>{n}</option>)}
                              </select>
                              <button
                                onClick={e => { e.stopPropagation(); saveInstructor(service.id, session.id) }}
                                disabled={savingInstructor}
                                className="h-7 px-2 text-[11.5px] font-medium bg-black text-white rounded-md disabled:opacity-40"
                              >{savingInstructor ? '…' : '✓'}</button>
                              <button
                                onClick={e => { e.stopPropagation(); setEditInstructorId(null) }}
                                className="h-7 px-1.5 text-[11.5px] text-neutral-400 hover:text-neutral-700"
                              >✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={e => { e.stopPropagation(); setEditInstructorId(session.id); setEditInstructorVal(session.instructor_name || '') }}
                              className="flex items-center gap-1.5 group text-left"
                              title="Edit instructor"
                            >
                              <span className="text-[13px] text-neutral-600">{session.instructor_name || '—'}</span>
                              <span className="text-[10px] text-neutral-300 group-hover:text-neutral-500 transition-colors">✏</span>
                            </button>
                          )}
                          <span className="text-[14.5px] text-neutral-600">{session.capacity}</span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full w-fit ${
                            session.status === 'CANCELLED'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {session.status === 'CANCELLED' ? 'Cancelled' : 'Active'}
                          </span>
                          <button
                            onClick={() => deleteSession(service.id, session.id)}
                            disabled={deletingSessionId === session.id}
                            className="text-neutral-300 hover:text-red-500 transition-colors text-sm disabled:opacity-40 touch-manipulation"
                            title="Delete session"
                          >
                            {deletingSessionId === session.id ? '…' : '✕'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New class modal — bottom sheet on mobile, centred on desktop */}
      {showNewClass && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowNewClass(false)} />
          <div className="relative bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full md:w-[420px] p-6 pb-8 md:pb-6">
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-4">New class</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1">Class name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Reformer Pilates"
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Short description"
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={newDuration}
                    onChange={e => setNewDuration(Number(e.target.value))}
                    min={15} max={180}
                    className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newCapacity}
                    onChange={e => setNewCapacity(Number(e.target.value))}
                    min={1} max={100}
                    className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                  />
                </div>
              </div>
              {classError && <p className="text-[12px] text-red-600">{classError}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => { setShowNewClass(false); setClassError('') }}
                className="h-8 px-4 text-[14.5px] text-neutral-600 border border-neutral-200 rounded-lg hover:border-neutral-400 touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={createClass}
                disabled={savingClass}
                className="h-8 px-4 text-[14.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 touch-manipulation"
              >
                {savingClass ? 'Creating…' : 'Create class'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add session modal — bottom sheet on mobile, centred on desktop */}
      {addSessionFor && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAddSessionFor(null)} />
          <div className="relative bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full md:w-[420px] p-6 pb-8 md:pb-6">
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-1">Add session</h2>
            <p className="text-[12px] text-neutral-400 mb-4">{addSessionFor.name}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1">Start date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                />
              </div>

              {/* Repeat weekly toggle */}
              <div className="flex items-center justify-between border border-neutral-200 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-[12px] font-medium text-neutral-700">Repeat weekly</p>
                  {sessionRepeatWeekly && (
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Creates {sessionRepeatWeeks} sessions (~{Math.round(sessionRepeatWeeks / 4.33)} months)
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {sessionRepeatWeekly && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        value={sessionRepeatWeeks}
                        onChange={e => setSessionRepeatWeeks(Math.max(1, Math.min(104, Number(e.target.value))))}
                        min={1} max={104}
                        className="w-14 h-7 px-2 text-[12px] text-center border border-neutral-200 rounded-lg outline-none focus:border-black"
                      />
                      <span className="text-[11px] text-neutral-400">weeks</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setSessionRepeatWeekly(v => !v)}
                    className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${sessionRepeatWeekly ? 'bg-black' : 'bg-neutral-200'}`}
                  >
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${sessionRepeatWeekly ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1">Start time</label>
                  <input
                    type="time"
                    value={sessionStartTime}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1">End time</label>
                  <input
                    type="time"
                    value={sessionEndTime}
                    onChange={e => setSessionEndTime(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1">Instructor</label>
                <select
                  value={sessionInstructor}
                  onChange={e => setSessionInstructor(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black bg-white"
                >
                  <option value="">— Unassigned —</option>
                  {instructors.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1">Capacity</label>
                <input
                  type="number"
                  value={sessionCapacity}
                  onChange={e => setSessionCapacity(Number(e.target.value))}
                  min={1} max={100}
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                />
              </div>
              {sessionError && <p className="text-[12px] text-red-600">{sessionError}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setAddSessionFor(null)}
                className="h-8 px-4 text-[14.5px] text-neutral-600 border border-neutral-200 rounded-lg hover:border-neutral-400 touch-manipulation"
              >
                Done
              </button>
              <button
                onClick={createSession}
                disabled={savingSession}
                className="h-8 px-4 text-[14.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 touch-manipulation"
              >
                {savingSession
                  ? (sessionRepeatWeekly ? `Adding ${sessionRepeatWeeks} sessions…` : 'Adding…')
                  : sessionRepeatWeekly
                    ? `Add ${sessionRepeatWeeks} sessions`
                    : 'Add session'
                }
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 text-right">Add multiple sessions without closing</p>
          </div>
        </div>
      )}

      {/* Edit class modal */}
      {editClassId && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditClassId(null)} />
          <div className="relative bg-white rounded-t-2xl md:rounded-xl shadow-2xl w-full md:w-[420px] p-6 pb-8 md:pb-6">
            <h2 className="text-[15px] font-semibold text-neutral-900 mb-1">Edit class</h2>
            <p className="text-[11px] text-neutral-400 mb-4">Capacity changes apply to all future sessions of this class.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1">Class name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-neutral-600 mb-1">Description (optional)</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1">Duration (min)</label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={e => setEditDuration(Number(e.target.value))}
                    min={15} max={180}
                    className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-neutral-600 mb-1">Capacity</label>
                  <input
                    type="number"
                    value={editCapacity}
                    onChange={e => setEditCapacity(Number(e.target.value))}
                    min={1} max={100}
                    className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                  />
                </div>
              </div>
              {editError && <p className="text-[12px] text-red-600">{editError}</p>}
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => setEditClassId(null)}
                className="h-8 px-4 text-[14.5px] text-neutral-600 border border-neutral-200 rounded-lg hover:border-neutral-400 touch-manipulation"
              >
                Cancel
              </button>
              <button
                onClick={saveEditClass}
                disabled={savingEdit}
                className="h-8 px-4 text-[14.5px] font-medium bg-black text-white rounded-lg hover:bg-neutral-800 disabled:opacity-40 touch-manipulation"
              >
                {savingEdit ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
