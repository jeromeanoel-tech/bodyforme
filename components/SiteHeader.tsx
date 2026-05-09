'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { studio, announce } from '@/lib/content'

const NAV_LEFT  = [
  { href: '/classes',     label: 'Classes'     },
  { href: '/memberships', label: 'Memberships' },
]
const NAV_RIGHT = [
  { href: '/about',   label: 'About Us' },
  { href: '/contact', label: 'Contact'  },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <>
      {/* Announce bar */}
      <div style={{ background: 'var(--esp)', color: 'oklch(.82 .02 60)', textAlign: 'center', fontSize: '11px', letterSpacing: '.14em', textTransform: 'uppercase', padding: '9px 20px' }}>
        {announce.text}{' '}
        <Link
          href={announce.linkHref}
          style={{ color: '#c4a882', borderBottom: '1px solid currentColor', textDecoration: 'none' }}
        >
          {announce.linkText}
        </Link>
      </div>

      {/* Sticky header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--linen)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 48px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>

          {/* Left nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1 }}>
            {NAV_LEFT.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive(href) ? ' active' : ''}`}
                style={{ fontSize: '10.5px', fontWeight: 400, letterSpacing: '.13em', textTransform: 'uppercase', color: isActive(href) ? 'var(--text)' : 'var(--mid)', textDecoration: 'none', transition: 'color .2s' }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Brand */}
          <Link href="/" style={{ flexShrink: 0, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/bodyforme-wordmark.png" alt="Bodyforme" style={{ height: 20, width: 'auto', display: 'block' }} />
          </Link>

          {/* Right nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1, justifyContent: 'flex-end' }}>
            {NAV_RIGHT.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive(href) ? ' active' : ''}`}
                style={{ fontSize: '10.5px', fontWeight: 400, letterSpacing: '.13em', textTransform: 'uppercase', color: isActive(href) ? 'var(--text)' : 'var(--mid)', textDecoration: 'none', transition: 'color .2s' }}
              >
                {label}
              </Link>
            ))}
            <Link
              href={studio.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--esp)', padding: '9px 20px', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background .2s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--brown)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--esp)')}
            >
              Book a Class
            </Link>
          </nav>
        </div>
      </header>
    </>
  )
}
