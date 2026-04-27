'use client'

import type { WixStaff, WixService, WixSession } from '@/lib/wix'

type Props = {
  staff:    WixStaff[]
  services: WixService[]
  sessions: WixSession[]   // this week
}

function fmt12(iso: string) {
  if (!iso) return ''
  const [, time] = iso.split('T')
  const [h, m] = time.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const h12  = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

export default function StaffClient({ staff, services, sessions }: Props) {
  const scheduleToService = Object.fromEntries(services.map(s => [s.scheduleId, s]))

  return (
    <div className="h-full overflow-y-auto bg-neutral-50">
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-neutral-900">Staff</h1>
            <p className="text-sm text-neutral-400 mt-0.5">{staff.length} team member{staff.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {staff.length === 0 ? (
          <div className="bg-white border border-neutral-200 rounded-xl px-6 py-12 text-center">
            <p className="text-sm text-neutral-400">No staff members found in Wix Bookings.</p>
            <p className="text-[12px] text-neutral-300 mt-1">Add staff in your Wix dashboard under Bookings → Staff.</p>
          </div>
        ) : (
          staff.map(member => {
            const memberSessions = sessions
              .filter(s => s.staffResourceId === member.resourceId && s.status !== 'CANCELLED')
              .sort((a, b) => a.start.localeCompare(b.start))

            const totalBooked   = memberSessions.reduce((n, s) => n + s.bookedCount, 0)
            const totalCapacity = memberSessions.reduce((n, s) => n + s.capacity, 0)

            return (
              <div key={member.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">

                {/* Member header */}
                <div className="px-6 py-5 flex items-center gap-4">
                  <div className="w-11 h-11 rounded-full bg-neutral-900 text-white text-[13px] font-semibold flex items-center justify-center shrink-0">
                    {initials(member.name)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[15px] font-semibold text-neutral-900">{member.name}</h2>
                    <p className="text-[12px] text-neutral-400 mt-0.5">Instructor</p>
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
