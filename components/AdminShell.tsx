'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import AdminSidebar from './AdminSidebar'
import LiveClock from './LiveClock'

export default function AdminShell({
  children,
  name,
  role,
}: {
  children: React.ReactNode
  name:     string
  role:     string
}) {
  const [open,      setOpen]      = useState(false)
  const [portrait,  setPortrait]  = useState(false)

  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  useEffect(() => {
    function check() {
      // Only show the overlay on narrow screens (phones in portrait)
      setPortrait(window.innerWidth < 768 && window.innerHeight > window.innerWidth)
    }
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', check)
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', check)
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-white">

      {/* Portrait-mode lock overlay — shown only on phones in portrait */}
      {portrait && (
        <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center text-white px-10 text-center">
          <svg
            width="56" height="56" viewBox="0 0 56 56" fill="none"
            className="mb-6 opacity-60"
            aria-hidden="true"
          >
            {/* Phone rotating to landscape */}
            <rect x="14" y="4" width="28" height="48" rx="4" stroke="white" strokeWidth="2" fill="none"/>
            <path d="M36 30 L42 36 L48 30" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M42 36 C42 24 34 18 28 18" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
          </svg>
          <p className="text-[18px] font-semibold mb-2">Rotate your device</p>
          <p className="text-[14px] text-white/60 leading-relaxed">
            The admin dashboard works best in landscape mode. Turn your phone sideways to continue.
          </p>
        </div>
      )}

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile landscape, static on md+ */}
      <div className={[
        'fixed inset-y-0 left-0 z-50 w-[260px]',
        'transition-transform duration-300 ease-in-out',
        'md:relative md:w-[220px] md:translate-x-0 md:z-auto md:transition-none md:shrink-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}>
        <AdminSidebar name={name} role={role} onClose={() => setOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        <header className="h-[52px] shrink-0 relative flex items-center justify-between px-4 border-b border-neutral-200 bg-white">
          {/* Hamburger — shows on narrow landscape screens (< md) */}
          <button
            onClick={() => setOpen(true)}
            className="md:hidden w-11 h-11 -ml-1 flex items-center justify-center text-neutral-700 touch-manipulation"
            aria-label="Open navigation"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
              <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Clock — desktop only */}
          <div className="hidden md:block flex-1">
            <LiveClock variant="admin" />
          </div>

          {/* Logo — centred */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <Image
              src="/bodyformeBlogo.png"
              alt="BodyForme"
              width={16}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:border-black transition-colors text-sm">
              🔔
            </button>
            <div className="w-9 h-9 rounded-full bg-black text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
              {initials}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden min-w-0">{children}</main>
      </div>
    </div>
  )
}
