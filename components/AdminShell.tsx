'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  const [open, setOpen] = useState(false)
  const router = useRouter()

  // Poll every 5 minutes — redirect to login if admin session has expired
  useEffect(() => {
    const check = async () => {
      const res = await fetch('/api/admin/memberships?limit=1', { method: 'GET' }).catch(() => null)
      if (res && res.status === 403) router.replace('/admin/login')
    }
    const id = setInterval(check, 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [router])
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex h-screen overflow-hidden bg-white">

      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, static on md+ */}
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
          {/* Hamburger — mobile only */}
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
