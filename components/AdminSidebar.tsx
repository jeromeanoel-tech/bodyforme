'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV: ({ href: string; label: string; exact?: boolean } | null)[] = [
  { href: '/admin',             label: 'Dashboard', exact: true },
  { href: '/admin/schedule',    label: 'Classes' },
  { href: '/admin/checkin',     label: 'Check In' },
  null,
  { href: '/admin/clients',     label: 'Clients' },
  { href: '/admin/memberships', label: 'Memberships' },
  { href: '/admin/insights',    label: 'Insights' },
  { href: '/admin/marketing',   label: 'Marketing' },
  null,
  { href: '/admin/staff',       label: 'Staff' },
  { href: '/admin/settings',    label: 'Settings' },
]

export default function AdminSidebar({ name, role }: { name: string; role: string }) {
  const path   = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="w-[220px] shrink-0 bg-black flex flex-col border-r border-neutral-800">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <span className="text-black text-xs font-bold">B</span>
          </div>
          <span className="text-white text-sm font-semibold tracking-wide">BodyForme</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item, i) =>
          item === null ? (
            <div key={i} className="my-2 border-t border-neutral-800" />
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg text-[12.5px] transition-colors ${
                (item.exact ? path === item.href : path.startsWith(item.href))
                  ? 'bg-white text-black font-medium'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {item.label}
            </Link>
          )
        )}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-neutral-800 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-neutral-700 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-[12px] font-medium truncate">{name}</p>
            <p className="text-neutral-500 text-[10.5px] capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-[11.5px] text-neutral-500 hover:text-red-400 transition-colors px-1"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
