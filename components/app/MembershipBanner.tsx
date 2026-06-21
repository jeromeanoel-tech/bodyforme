'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const T = {
  esp:    '#2a1506',
  brown:  '#7a4a2a',
  linen:  '#f4ede1',
  rust:   '#9a5a3a',
  amber:  '#b87333',
}

type Status = { plan: string | null; status: string; membershipEndDate: string | null }

export default function MembershipBanner() {
  const [status, setStatus] = useState<Status | null>(null)

  useEffect(() => {
    fetch('/api/app/membership-status')
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setStatus(d))
      .catch(() => {})
  }, [])

  if (!status) return null

  const isInactive = status.status === 'inactive'
  const isPastEnd  = status.membershipEndDate
    ? new Date(status.membershipEndDate) < new Date()
    : false
  const hasNoPlan  = !status.plan

  if (!isInactive && !isPastEnd && !hasNoPlan) return null

  const message = isInactive || hasNoPlan
    ? 'Your membership is not active.'
    : 'Your membership has expired.'

  return (
    <div style={{
      background:     T.rust,
      color:          T.linen,
      padding:        '10px 20px',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      gap:            12,
      flexShrink:     0,
    }}>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 12, lineHeight: 1.4 }}>
        <span style={{ fontWeight: 600 }}>{message}</span>
        {' '}Renew to continue booking classes.
      </div>
      <Link
        href="/app/membership"
        style={{
          fontFamily:      "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize:        10,
          fontWeight:      600,
          letterSpacing:   '.12em',
          textTransform:   'uppercase',
          color:           T.linen,
          border:          `1px solid ${T.linen}`,
          padding:         '6px 12px',
          textDecoration:  'none',
          whiteSpace:      'nowrap',
          flexShrink:      0,
        }}
      >
        Renew
      </Link>
    </div>
  )
}
