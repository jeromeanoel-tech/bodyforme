'use client'

import { useState } from 'react'
import type { TemplateRow } from '@/lib/db'

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

function fmt12(hhmm: string) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'am' : 'pm'
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export default function ScheduleAccordion({
  byDay,
  bookingUrl,
}: {
  byDay: Record<string, TemplateRow[]>
  bookingUrl: string
}) {
  const [openRow, setOpenRow] = useState<string | null>(null)

  return (
    <div>
      {DAYS_ORDER.map((day) => {
        const rows = byDay[day] ?? []

        return (
          <div key={day} style={{ borderBottom: '1px solid var(--rule)' }}>
            {/* Day header */}
            <div style={{ padding: '14px 0 10px' }}>
              <span style={{
                fontFamily: "'Cormorant Garamond','Times New Roman',serif",
                fontSize: 22,
                fontWeight: 300,
                color: 'var(--esp)',
              }}>
                {DAY_LABELS[day]}
              </span>
            </div>

            {rows.length === 0 ? (
              <div style={{ padding: '12px 0 16px', fontSize: 13, color: 'var(--muted)', fontStyle: 'italic' }}>
                No classes scheduled
              </div>
            ) : (
              rows.map(r => {
                const isOpen = openRow === r.id
                return (
                  <div key={r.id} style={{ marginBottom: '1px' }}>
                    <button
                      onClick={() => setOpenRow(isOpen ? null : r.id)}
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
                        {fmt12(r.start)}
                      </span>
                      <span style={{
                        fontFamily: "'Cormorant Garamond','Times New Roman',serif",
                        fontSize: 18,
                        fontWeight: 400,
                        color: isOpen ? 'var(--linen)' : 'var(--esp)',
                        lineHeight: 1.2,
                        flex: 1,
                      }}>
                        {r.className}
                      </span>
                      <span style={{
                        color: isOpen ? 'var(--linen)' : 'var(--brown)',
                        fontSize: 16,
                        flexShrink: 0,
                        transition: 'transform .2s',
                        display: 'block',
                        transform: isOpen ? 'rotate(90deg)' : 'none',
                      }}>›</span>
                    </button>

                    {isOpen && (
                      <div style={{
                        background: 'var(--canvas)',
                        borderLeft: `3px solid var(--brown)`,
                        padding: '16px 16px 20px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <p style={{ margin: 0, fontSize: 13, color: 'var(--mid)', fontWeight: 300 }}>
                            {fmt12(r.start)} – {fmt12(r.end)}
                          </p>
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
