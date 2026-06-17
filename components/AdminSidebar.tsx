'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type NavItem = { href: string; label: string; exact?: boolean; adminOnly?: boolean }

const NAV: (NavItem | null)[] = [
  { href: '/admin',             label: 'Dashboard',   exact: true },
  { href: '/admin/schedule',    label: 'Schedule' },
  { href: '/admin/checkin',     label: 'Check In' },
  { href: '/admin/classes',     label: 'Classes',     adminOnly: true },
  { href: '/admin/pos',         label: 'POS',         adminOnly: true },
  null,
  { href: '/admin/clients',     label: 'Clients' },
  { href: '/admin/memberships', label: 'Memberships' },
  { href: '/admin/insights',    label: 'Insights',    adminOnly: true },
  { href: '/admin/marketing',   label: 'Marketing',   adminOnly: true },
  null,
  { href: '/admin/staff',       label: 'Staff',       adminOnly: true },
  { href: '/admin/settings',    label: 'Settings',    adminOnly: true },
]

export default function AdminSidebar({
  name,
  role,
  onClose,
}: {
  name:      string
  role:      string
  onClose?:  () => void
}) {
  const isAdmin = role === 'admin'
  const path   = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="h-full bg-black flex flex-col border-r border-neutral-800">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-neutral-800 flex justify-center">
        <div className="bg-white rounded-xl px-3 py-2.5 flex items-center justify-center">
          <Image
            src="/bodyformeBlogo.png"
            alt="BodyForme"
            width={22}
            height={44}
            className="h-10 w-auto"
            priority
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item, i) => {
          if (item === null) {
            // Skip dividers that would end up adjacent due to filtered items
            return <div key={i} className="my-2 border-t border-neutral-800" />
          }
          if (item.adminOnly && !isAdmin) return null
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center px-3 py-3 rounded-lg text-[16px] transition-colors min-h-[44px] ${
                (item.exact ? path === item.href : path.startsWith(item.href))
                  ? 'bg-white text-black font-medium'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-4 py-4 border-t border-neutral-800 space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-neutral-700 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-[15px] font-medium truncate">{name}</p>
            <p className="text-neutral-500 text-[13px] capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-[15px] text-neutral-500 hover:text-red-400 transition-colors px-1 min-h-[44px] flex items-center"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
