'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV: ({ href: string; label: string; exact?: boolean } | null)[] = [
  { href: '/admin',             label: 'Dashboard', exact: true },
  { href: '/admin/schedule',    label: 'Classes' },
  { href: '/admin/checkin',     label: 'Check In' },
  null,
  { href: '/admin/clients',     label: 'Clients' },
  { href: '/admin/memberships', label: 'Memberships' },
  { href: '/admin/insights',    label: 'Insights' },
  null,
  { href: '/admin/staff',       label: 'Staff' },
  { href: '/admin/settings',    label: 'Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Sidebar */}
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

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-800">
          <p className="text-neutral-500 text-[11px]">BodyForme Studio</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-[52px] shrink-0 flex items-center justify-between px-6 border-b border-neutral-200 bg-white">
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:border-black transition-colors text-sm">
              🔔
            </button>
            <div className="w-8 h-8 rounded-full bg-black text-white text-[11px] font-semibold flex items-center justify-center">
              SZ
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
