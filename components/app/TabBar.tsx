'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  {
    id:    'schedule',
    label: 'Schedule',
    href:  '/app/schedule',
    icon:  (
      <path d="M3 4h14v12H3V4zm3-2v3M14 2v3M3 8h14"
        stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
    ),
  },
  {
    id:    'bookings',
    label: 'Bookings',
    href:  '/app/bookings',
    icon:  (
      <path d="M4 3h12v14l-6-3-6 3V3z"
        stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
    ),
  },
  {
    id:    'membership',
    label: 'Membership',
    href:  '/app/membership',
    icon:  (
      <>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" fill="none"/>
        <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>
      </>
    ),
  },
  {
    id:    'profile',
    label: 'Profile',
    href:  '/app/profile',
    icon:  (
      <>
        <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" fill="none"/>
        <path d="M3 17c1-3.5 4-5 7-5s6 1.5 7 5"
          stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      </>
    ),
  },
]

export default function TabBar() {
  const path = usePathname()

  return (
    <div style={{
      background:  '#f4ede1',
      borderTop:   '1px solid #d8ccba',
      display:     'flex',
      paddingTop:  10,
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
      flexShrink:  0,
    }}>
      {TABS.map(t => {
        const active = path.startsWith(t.href)
        const color  = active ? '#7a4a2a' : '#a08568'
        return (
          <Link key={t.id} href={t.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, color,
            textDecoration: 'none',
          }}>
            <svg width="20" height="20" viewBox="0 0 20 20">{t.icon}</svg>
            <span style={{
              fontFamily:    "'DM Sans', system-ui, sans-serif",
              fontSize:      9,
              fontWeight:    500,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}>{t.label}</span>
          </Link>
        )
      })}
    </div>
  )
}
