'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { studio, announce } from '@/lib/content'

const NAV = [
  { href: '/classes',     label: 'Classes'     },
  { href: '/memberships', label: 'Memberships' },
  { href: '/about',       label: 'About'       },
  { href: '/contact',     label: 'Contact'     },
]

export default function SiteHeader() {
  const pathname  = usePathname()
  const [open,    setOpen]    = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const navBorderColor = scrolled ? 'var(--rule)' : 'transparent'
  const navBg          = scrolled ? 'var(--canvas)' : 'rgba(253,250,246,.92)'
  const navShadow      = scrolled ? '0 1px 24px rgba(42,21,6,.06)' : 'none'

  return (
    <>
      {/* ── Announce bar ─────────────────────────────────────────────────── */}
      <div
        className="announce-bar"
        style={{
          background: 'var(--esp)',
          color: 'oklch(.82 .02 60)',
          textAlign: 'center',
          fontSize: '10.5px',
          letterSpacing: '.15em',
          textTransform: 'uppercase',
          padding: '10px 20px',
          lineHeight: 1.5,
          fontFamily: 'var(--font-dm-sans)',
        }}
      >
        {announce.text}{' '}
        <Link
          href={announce.linkHref}
          style={{ color: '#c4a882', borderBottom: '1px solid currentColor', textDecoration: 'none' }}
        >
          {announce.linkText}
        </Link>
      </div>

      {/* ── Sticky header ────────────────────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: navBg,
          borderBottom: `1px solid ${navBorderColor}`,
          boxShadow: navShadow,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition: 'background .35s ease, border-color .35s ease, box-shadow .35s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1320px',
            margin: '0 auto',
            padding: '0 48px',
            height: scrolled ? '60px' : '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'height .35s ease',
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ flexShrink: 0, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <img
              src="/bodyformeBlogo.png"
              alt="BodyForme"
              style={{ height: scrolled ? 30 : 34, width: 'auto', display: 'block', transition: 'height .35s ease' }}
            />
          </Link>

          {/* Desktop nav */}
          <nav
            className="desk-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '40px',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
          >
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`nav-link${isActive(href) ? ' active' : ''}`}
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '10px',
                  fontWeight: isActive(href) ? 500 : 400,
                  letterSpacing: '.15em',
                  textTransform: 'uppercase',
                  color: isActive(href) ? 'var(--esp)' : 'var(--mid)',
                  textDecoration: 'none',
                  transition: 'color .2s ease',
                }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop right actions */}
          <div className="desk-nav" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <Link
              href="/app"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '10px',
                fontWeight: 400,
                letterSpacing: '.15em',
                textTransform: 'uppercase',
                color: 'var(--mid)',
                textDecoration: 'none',
                padding: '8px 0',
                transition: 'color .2s ease',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'var(--esp)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'var(--mid)' }}
            >
              Member Login
            </Link>
            <Link
              href="/free-trial"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: 'var(--canvas)',
                background: 'var(--esp)',
                padding: '10px 22px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                transition: 'background .25s ease',
                border: '1px solid var(--esp)',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--brown)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--brown)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'var(--esp)'; (e.currentTarget as HTMLElement).style.borderColor = 'var(--esp)' }}
            >
              Book Free Trial
            </Link>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="mob-hamburger"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle menu"
            style={{
              width: '40px',
              height: '40px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: 'var(--esp)',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 'auto',
            }}
          >
            {/* Hamburger icon — 3 lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '22px' }}>
              <span style={{ height: '1px', background: 'var(--esp)', display: 'block', transition: 'all .3s', transform: open ? 'rotate(45deg) translate(4px, 4px)' : 'none' }} />
              <span style={{ height: '1px', background: 'var(--esp)', display: 'block', transition: 'all .3s', opacity: open ? 0 : 1 }} />
              <span style={{ height: '1px', background: 'var(--esp)', display: 'block', transition: 'all .3s', transform: open ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }} />
            </div>
          </button>
        </div>
      </header>

      {/* ── Full-screen mobile overlay ──────────────────────────────────── */}
      <div className={`mob-overlay${open ? ' open' : ''}`}>
        {/* Top bar inside overlay */}
        <div
          style={{
            height: '68px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <Link href="/" onClick={() => setOpen(false)} style={{ textDecoration: 'none' }}>
            <img
              src="/bodyformeBlogo.png"
              alt="BodyForme"
              style={{ height: 30, width: 'auto', filter: 'brightness(0) invert(1)', opacity: .85 }}
            />
          </Link>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(244,237,225,.7)',
              fontSize: '22px',
              lineHeight: 1,
              padding: '8px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '32px' }}>
          {NAV.map(({ href, label }, i) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="mob-overlay-link"
              style={{ transitionDelay: open ? `${i * 60 + 80}ms` : '0ms' }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Bottom CTA */}
        <div
          style={{
            opacity: open ? 1 : 0,
            transform: open ? 'translateY(0)' : 'translateY(12px)',
            transition: 'opacity .4s ease .4s, transform .4s ease .4s',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <Link
            href="/free-trial"
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              textAlign: 'center',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '10.5px',
              fontWeight: 500,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'var(--esp)',
              background: 'var(--linen)',
              padding: '16px 24px',
              textDecoration: 'none',
            }}
          >
            Book Free Trial
          </Link>
          <Link
            href="/app"
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              textAlign: 'center',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '10.5px',
              fontWeight: 400,
              letterSpacing: '.16em',
              textTransform: 'uppercase',
              color: 'rgba(244,237,225,.6)',
              border: '1px solid rgba(255,255,255,.12)',
              padding: '15px 24px',
              textDecoration: 'none',
            }}
          >
            Member Login
          </Link>
        </div>
      </div>
    </>
  )
}
