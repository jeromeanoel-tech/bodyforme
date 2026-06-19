import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import AdminShell from '@/components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')

  return (
    <AdminShell
      name={session.name}
      role={session.role}
    >
      {children}
    </AdminShell>
  )
}
