import Image from 'next/image'
import { getAdminSession } from '@/lib/adminSession'
import AdminSidebar from '@/components/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <AdminSidebar
        name={session?.name ?? ''}
        role={session?.role ?? 'staff'}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-[52px] shrink-0 relative flex items-center justify-between px-6 border-b border-neutral-200 bg-white">
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search clients..."
              className="w-full h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
          {/* Centred logo */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <Image
              src="/bodyformeBlogo.png"
              alt="BodyForme"
              width={16}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg border border-neutral-200 flex items-center justify-center text-neutral-500 hover:border-black transition-colors text-sm">
              🔔
            </button>
            <div className="w-8 h-8 rounded-full bg-black text-white text-[11px] font-semibold flex items-center justify-center">
              {(session?.name ?? 'XX').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
