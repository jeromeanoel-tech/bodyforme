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
  const d = new Date(iso)
  return d.toLocaleString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function ClassesClient({ initialServices }: { initialServices: Service[] }) {
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

  const [addSessionFor,    setAddSessionFor]    = useState<Service | null>(null)
  const [sessionDate,      setSessionDate]      = useState('')
  const [sessionStartTime, setSessionStartTime] = useState('')
  const [sessionEndTime,   setSessionEndTime]   = useState('')
  const [sessionInstructor, setSessionInstructor] = useState('')
  const [sessionCapacity,  setSessionCapacity]  = useState(25)
  const [savingSession,    setSavingSession]    = useState(false)
  const [sessionError,     setSessionError]     = useState('')

  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

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
    await fetch('/api/admin/classes', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    setServices(prev => prev.filter(s => s.id !== id))
    setSessions(prev => { const next = { ...prev }; delete next[id]; return next })
    if (expandedId === id) setExpandedId(null)
    setDeleteConfirmId(null)
    setDeletingId(null)
    router.refresh()
  }

  function openAddSession(service: Service) {
    setAddSessionFor(service)
    setSessionDate('')
    setSessionStartTime('')
    setSessionEndTime('')
    setSessionInstructor('')
    setSessionCapacity(service.capacity)
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
    const startTime = `${sessionDate}T${sessionStartTime}:00`
    const endTime   = `${sessionDate}T${sessionEndTime}:00`
    const res  = await fetch('/api/admin/sessions', {
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
            onClick={e => { e.stopPropagation(); setDeleteConfirmId(service.id) }}
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
                  /* Horizontal scroll on mobile so the fixed-width grid doesn't wrap */
                  <div className="overflow-x-auto">
                    <div style={{ minWidth: 480 }}>
                      <div className="grid px-8 py-2 border-b border-neutral-200" style={{ gridTemplateColumns: '1fr 160px 80px 80px 40px' }}>
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
                          style={{ gridTemplateColumns: '1fr 160px 80px 80px 40px' }}
                        >
                          <span className="text-[14.5px] text-neutral-700">{fmt(session.start_time)}</span>
                          <span className="text-[14.5px] text-neutral-600">{session.instructor_name || '—'}</span>
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
                  </div>
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
                <label className="block text-[12px] font-medium text-neutral-600 mb-1">Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={e => setSessionDate(e.target.value)}
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                />
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
                <label className="block text-[12px] font-medium text-neutral-600 mb-1">Instructor (optional)</label>
                <input
                  type="text"
                  value={sessionInstructor}
                  onChange={e => setSessionInstructor(e.target.value)}
                  placeholder="e.g. Suzanne Harb"
                  className="w-full h-9 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black"
                />
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
                {savingSession ? 'Adding…' : 'Add session'}
              </button>
            </div>
            <p className="text-[11px] text-neutral-400 mt-2 text-right">Add multiple sessions without closing</p>
          </div>
        </div>
      )}
    </div>
  )
}
