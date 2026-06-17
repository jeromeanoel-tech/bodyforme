import { getAdminSession } from '@/lib/adminSession'
import AdminShell from '@/components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()

  return (
    <AdminShell
      name={session?.name ?? ''}
      role={session?.role ?? 'staff'}
    >
      {children}
    </AdminShell>
  )
}
