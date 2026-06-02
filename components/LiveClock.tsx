'use client'

import { useState, useEffect } from 'react'

type Variant = 'admin' | 'member'

export default function LiveClock({ variant = 'admin' }: { variant?: Variant }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (!now) return null

  const time = now.toLocaleTimeString('en-AU', {
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Australia/Melbourne',
  })

  const date = now.toLocaleDateString('en-AU', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
    timeZone: 'Australia/Melbourne',
  })

  if (variant === 'member') {
    return (
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: '#2a1506', fontVariantNumeric: 'tabular-nums' }}>
          {time}
        </span>
        <span style={{ fontSize: 12, color: '#a08568' }}>{date}</span>
      </div>
    )
  }

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-[14px] font-semibold text-neutral-800 tabular-nums">{time}</span>
      <span className="text-[11.5px] text-neutral-400">{date}</span>
    </div>
  )
}
