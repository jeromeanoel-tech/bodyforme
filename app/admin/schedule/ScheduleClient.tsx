'use client'

import { useState } from 'react'
import type { WixSession, WixService, WixStaff, WixBooking } from '@/lib/wix'
import { useSettings } from '@/lib/useSettings'

type Props = {
  sessions: WixSession[]
  scheduleToService: Record<string, WixService>
  resourceToStaff: Record<string, WixStaff>
  weekStart: string
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function fmt12(iso: string) {
  if (!iso) return ''
  const [, time] = iso.split('T')
  const [h, m] = time.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function dayLabel(date: Date) {
  return date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })
}

function isToday(date: Date) {
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

export default function ScheduleClient({ sessions, scheduleToService, resourceToStaff, weekStart }: Props) {
  const [selectedSession, setSelectedSession] = useState<WixSession | null>(null)
  const [search, setSearch] = useState('')
  const { settings } = useSettings()

  const monday = new Date(weekStart)

  // Build 7-day structure
  const days = DAYS.map((_, i) => {
    const date = new Date(monday)
    date.setDate(monday.getDate() + i)
    const dateStr = date.toISOString().slice(0, 10)
    const daySessions = sessions
      .filter(s => s.start.startsWith(dateStr))
      .filter(s => settings.showCancelledClasses || s.status !== 'CANCELLED')
      .filter(s => {
        if (!search) return true
        const svc = scheduleToService[s.scheduleId]
        const staff = resourceToStaff[s.staffResourceId]
        return (
          svc?.name.toLowerCase().includes(search.toLowerCase()) ||
          staff?.name.toLowerCase().includes(search.toLowerCase())
        )
      })
      .sort((a, b) => a.start.localeCompare(b.start))
    return { date, daySessions }
  })

  const totalSessions = sessions.length
  const totalBooked   = sessions.reduce((n, s) => n + s.bookedCount, 0)
  const totalCap      = sessions.reduce((n, s) => n + s.capacity, 0)

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-3 border-b border-neutral-200 bg-white">
        <span className="text-sm font-medium text-neutral-700">
          {monday.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          {' – '}
          {new Date(monday.getTime() + 6 * 86400000).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter by class or instructor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black w-56"
          />
          {(['Day', 'Week', 'Month'] as const).map(v => (
            <button
              key={v}
              className={`h-8 px-3 text-sm rounded-lg border transition-colors ${
                v === 'Week'
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-400'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className="flex-1 overflow-y-auto">
        {days.map(({ date, daySessions }) => (
          <section key={date.toISOString()}>
            {/* Day header */}
            <div className={`sticky top-0 z-10 grid border-b border-neutral-200 px-6 py-2 ${
              isToday(date) ? 'bg-neutral-100' : 'bg-neutral-50'
            }`}
              style={{ gridTemplateColumns: '160px 1fr 200px 160px 48px' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-neutral-800">
                  {dayLabel(date)}
                </span>
                {isToday(date) && (
                  <span className="text-[10px] font-semibold bg-black text-white px-2 py-0.5 rounded-full">
                    TODAY
                  </span>
                )}
              </div>
              <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider self-center">Class</span>
              <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider self-center">Instructor</span>
              <span className="text-[10.5px] font-semibold text-neutral-400 uppercase tracking-wider self-center">Sign In</span>
              <span />
            </div>

            {/* Sessions */}
            {daySessions.length === 0 ? (
              <div className="px-6 py-4 text-sm text-neutral-400 border-b border-neutral-100">
                No classes scheduled
              </div>
            ) : (
              daySessions.map(session => {
                const svc       = scheduleToService[session.scheduleId]
                const staff     = resourceToStaff[session.staffResourceId]
                const cancelled = session.status === 'CANCELLED'
                const pct       = session.capacity > 0 ? session.bookedCount / session.capacity : 0
                const full      = pct >= 1

                return (
                  <div
                    key={session.id}
                    className={`grid items-center px-6 py-3 border-b border-neutral-100 transition-colors ${
                      cancelled ? 'opacity-50' : 'hover:bg-neutral-50 cursor-pointer'
                    }`}
                    style={{ gridTemplateColumns: '160px 1fr 200px 160px 48px' }}
                    onClick={() => !cancelled && setSelectedSession(session)}
                  >
                    {/* Time */}
                    <span className={`text-[12px] ${cancelled ? 'text-neutral-400 line-through' : 'text-neutral-500'}`}>
                      {fmt12(session.start)} – {fmt12(session.end)}
                    </span>

                    {/* Class */}
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded shrink-0 ${cancelled ? 'bg-neutral-300' : 'bg-black'}`} />
                      <span className={`text-[12.5px] font-medium ${cancelled ? 'text-neutral-400 line-through' : 'text-neutral-800'}`}>
                        {svc?.name ?? session.title}
                      </span>
                      {cancelled && (
                        <span className="text-[10px] font-semibold bg-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Cancelled
                        </span>
                      )}
                    </div>

                    {/* Instructor */}
                    <div className="flex items-center gap-2">
                      <div className="w-[14px] h-[14px] rounded border border-neutral-300 shrink-0" />
                      <span className="text-[12.5px] text-neutral-700">
                        {staff?.name ?? '—'}
                      </span>
                    </div>

                    {/* Sign in */}
                    {cancelled ? (
                      <span />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${full ? 'bg-red-500' : 'bg-black'}`}
                            style={{ width: `${Math.min(pct * 100, 100)}%` }}
                          />
                        </div>
                        <span className={`text-[12px] font-semibold ${full ? 'text-red-500' : 'text-neutral-800'}`}>
                          {session.bookedCount}/{session.capacity}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <button
                      className="w-7 h-7 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-400 hover:border-neutral-400 hover:text-neutral-700 transition-colors text-base"
                      onClick={e => { e.stopPropagation() }}
                    >
                      ⋯
                    </button>
                  </div>
                )
              })
            )}
          </section>
        ))}

        {/* Stats footer */}
        <div className="px-6 py-5 border-t border-neutral-200 bg-white flex items-center gap-8">
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Sessions</p>
            <p className="text-xl font-semibold text-neutral-900 mt-0.5">{totalSessions}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Total Booked</p>
            <p className="text-xl font-semibold text-neutral-900 mt-0.5">{totalBooked}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-400 uppercase tracking-wider">Avg Fill Rate</p>
            <p className="text-xl font-semibold text-neutral-900 mt-0.5">
              {totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Attendee drawer */}
      {selectedSession && (
        <AttendeeDrawer
          session={selectedSession}
          serviceName={scheduleToService[selectedSession.scheduleId]?.name ?? selectedSession.title}
          staffName={resourceToStaff[selectedSession.staffResourceId]?.name}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  )
}

// ── Attendee drawer ───────────────────────────────────────────────────────────

function AttendeeDrawer({
  session, serviceName, staffName, onClose,
}: {
  session: WixSession
  serviceName: string
  staffName?: string
  onClose: () => void
}) {
  const [bookings, setBookings] = useState<WixBooking[] | null>(null)
  const [loading, setLoading]   = useState(false)

  if (bookings === null && !loading) {
    setLoading(true)
    fetch(`/api/admin/session-bookings?eventId=${session.id}`)
      .then(r => r.json())
      .then(d => { setBookings(d.bookings ?? []); setLoading(false) })
      .catch(() => { setBookings([]); setLoading(false) })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-[380px] bg-white h-full shadow-2xl flex flex-col border-l border-neutral-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 flex items-start justify-between">
          <div>
            <h2 className="font-semibold text-neutral-900">{serviceName}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              {fmt12(session.start)} · {staffName ?? 'No instructor'} · {session.bookedCount}/{session.capacity} booked
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 text-xl mt-0.5">×</button>
        </div>

        {/* Attendees */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="px-6 py-8 text-sm text-neutral-400">Loading attendees…</div>
          )}
          {!loading && bookings?.length === 0 && (
            <div className="px-6 py-8 text-sm text-neutral-400">No bookings yet.</div>
          )}
          {bookings?.map((b, i) => (
            <div key={b.id} className={`flex items-center justify-between px-6 py-3.5 ${i < bookings.length - 1 ? 'border-b border-neutral-100' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-[11px] font-semibold text-neutral-600">
                  {b.contactDetails.firstName?.[0]}{b.contactDetails.lastName?.[0]}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-neutral-900">
                    {b.contactDetails.firstName} {b.contactDetails.lastName}
                  </p>
                  <p className="text-[11.5px] text-neutral-400">{b.contactDetails.email}</p>
                </div>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                b.status === 'CONFIRMED'
                  ? 'bg-neutral-100 text-neutral-600'
                  : 'bg-neutral-100 text-neutral-500'
              }`}>
                {b.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
