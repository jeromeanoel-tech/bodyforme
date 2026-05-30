'use client'

import { useState } from 'react'
import Link from 'next/link'

type Session = {
  id: string
  title: string
  start: string
  end: string
  capacity: number
  bookedCount: number
  scheduleId: string
}

function fmt12(iso: string) {
  if (!iso) return ''
  const [, time] = iso.split('T')
  const [h, m] = time.split(':').map(Number)
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

function dayLabel(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ScheduleAccordion({
  sessions,
  days,
  scheduleToName,
  bookingUrl,
  todayStr,
}: {
  sessions: Session[]
  days: Date[]
  scheduleToName: Record<string, string>
  bookingUrl: string
  todayStr: string
}) {
  const [openSession, setOpenSession] = useState<string | null>(null)

  return (
    <div>
      {days.map((day) => {
        const dayStr = day.toISOString().slice(0, 10)
        const isToday = dayStr === todayStr
        const daySessions = sessions
          .filter(s => s.start.startsWith(dayStr) && !s.title.toLowerCase().includes('cancel'))
          .sort((a, b) => a.start.localeCompare(b.start))

        return (
          <div key={dayStr} style={{ borderBottom: '1px solid var(--rule)' }}>
            {/* Day header */}
            <div style={{
              padding: '14px 0 10px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
            }}>
              <span style={{
                fontFamily: "'Cormorant Garamond','Times New Roman',serif",
                fontSize: 22,
                fontWeight: 300,
                color: isToday ? 'var(--brown)' : 'var(--esp)',
              }}>
                {day.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' })}
              </span>
              {isToday && (
                <span style={{
                  fontSize: 9,
                  letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  background: 'var(--brown)',
                  color: 'var(--canvas)',
                  padding: '2px 7px',
                  fontWeight: 500,
                }}>Today</span>
              )}
              <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '.04em' }}>
                {day.toLocaleDateString('en-AU', { month: 'long' })}
              </span>
            </div>

            {daySessions.length === 0 ? (
              <div style={{ padding: '12px 0 16px', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                No classes scheduled
              </div>
            ) : (
              daySessions.map(s => {
                const name = scheduleToName[s.scheduleId] ?? s.title
                const isFull = s.bookedCount >= s.capacity
                const spotsLeft = s.capacity - s.bookedCount
                const isOpen = openSession === s.id

                return (
                  <div key={s.id} style={{ marginBottom: '1px' }}>
                    {/* Row — always visible */}
                    <button
                      onClick={() => setOpenSession(isOpen ? null : s.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: isOpen ? 'var(--brown)' : 'var(--linen)',
                        border: 'none',
                        borderLeft: `3px solid var(--brown)`,
                        padding: '14px 16px',
                        cursor: 'pointer',
                        gap: 12,
                        textAlign: 'left',
                        transition: 'background .15s',
                      }}
                    >
                      <span style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: isOpen ? 'rgba(244,237,225,.7)' : 'var(--brown)',
                        letterSpacing: '.04em',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        minWidth: 70,
                      }}>
                        {fmt12(s.start)}
                      </span>
                      <span style={{
                        fontFamily: "'Cormorant Garamond','Times New Roman',serif",
                        fontSize: 18,
                        fontWeight: 400,
                        color: isOpen ? 'var(--linen)' : 'var(--esp)',
                        lineHeight: 1.2,
                        flex: 1,
                      }}>
                        {name}
                      </span>
                      {isFull && (
                        <span style={{ fontSize: 10, color: isOpen ? 'rgba(244,237,225,.5)' : 'var(--muted)', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>
                          Full
                        </span>
                      )}
                      <span style={{
                        color: isOpen ? 'var(--linen)' : 'var(--brown)',
                        fontSize: 16,
                        flexShrink: 0,
                        transition: 'transform .2s',
                        display: 'block',
                        transform: isOpen ? 'rotate(90deg)' : 'none',
                      }}>›</span>
                    </button>

                    {/* Expanded drawer */}
                    {isOpen && (
                      <div style={{
                        background: 'var(--canvas)',
                        borderLeft: `3px solid var(--brown)`,
                        padding: '16px 16px 20px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: 13, color: 'var(--mid)', fontWeight: 300 }}>
                              {fmt12(s.start)} – {fmt12(s.end)}
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: 12, color: isFull ? 'var(--muted)' : spotsLeft <= 3 ? 'var(--rust)' : 'var(--muted)' }}>
                              {isFull ? 'Class is full' : `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} remaining`}
                            </p>
                          </div>
                          {!isFull && (
                            <a
                              href={bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                fontSize: 10,
                                fontWeight: 500,
                                letterSpacing: '.14em',
                                textTransform: 'uppercase',
                                color: 'var(--linen)',
                                background: 'var(--brown)',
                                padding: '11px 20px',
                                textDecoration: 'none',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Book →
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )
      })}
    </div>
  )
}
