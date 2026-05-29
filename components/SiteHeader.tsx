'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { studio, announce } from '@/lib/content'

const NAV_LEFT  = [
  { href: '/classes',     label: 'Classes'     },
  { href: '/memberships', label: 'Memberships' },
]
const NAV_RIGHT = [
  { href: '/about',   label: 'About Us' },
  { href: '/contact', label: 'Contact'  },
]
const ALL_NAV = [...NAV_LEFT, ...NAV_RIGHT]

export default function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
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
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', gap: '32px' }}>

          {/* Brand — left-aligned, always visible */}
          <Link href="/" style={{ flexShrink: 0, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img src="/bodyformeBlogo.png" alt="BodyForme" style={{ height: 36, width: 'auto', display: 'block' }} />
          </Link>

          {/* Desktop: nav links */}
          <nav className="desk-nav" style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1 }}>
            {ALL_NAV.map(({ href, label }) => (
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

          {/* Desktop: log in + book button */}
          <Link
            href="/app/login"
            className="desk-book-btn"
            style={{ fontSize: '10px', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--mid)', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0, borderBottom: '1px solid var(--rule)', paddingBottom: '1px' }}
          >
            Log in
          </Link>
          <Link
            href={studio.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="desk-book-btn"
            style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--esp)', padding: '9px 20px', textDecoration: 'none', whiteSpace: 'nowrap', transition: 'background .2s', flexShrink: 0 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--brown)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--esp)')}
          >
            Book a Class
          </Link>

          {/* Mobile: hamburger */}
          <button
            className="mob-hamburger"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
            style={{ width: '40px', height: '40px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--esp)', flexShrink: 0, fontSize: '20px', lineHeight: 1, marginLeft: 'auto' }}
          >
            {open ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile: dropdown menu */}
        <div className={`mob-menu${open ? ' mob-menu-open' : ''}`} style={{ flexDirection: 'column', background: 'var(--linen)', borderTop: '1px solid var(--rule)', paddingBottom: '16px' }}>
          {ALL_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '15px 24px', fontSize: '11px', fontWeight: 400, letterSpacing: '.13em', textTransform: 'uppercase', color: isActive(href) ? 'var(--esp)' : 'var(--mid)', textDecoration: 'none', borderBottom: '1px solid var(--rule)' }}
            >
              {label}
            </Link>
          ))}
          <div style={{ padding: '16px 24px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/app/login"
              onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '14px 24px', fontSize: '10.5px', fontWeight: 400, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--esp)', background: 'transparent', border: '1px solid var(--rule)', textDecoration: 'none', textAlign: 'center' }}
            >
              Log in
            </Link>
            <Link
              href={studio.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{ display: 'block', padding: '14px 24px', fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--esp)', textDecoration: 'none', textAlign: 'center' }}
            >
              Book a Class
            </Link>
          </div>
        </div>
      </header>
    </>
  )
}
