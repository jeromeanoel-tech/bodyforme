import { getAdminSession } from '@/lib/adminSession'
import AdminShell from '@/components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession()

  // Middleware handles route protection — unauthenticated requests only reach
  // this layout for /admin/login, /admin/forgot-password, /admin/reset-password
  if (!session) return <>{children}</>

  return (
    <AdminShell
      name={session.name}
      role={session.role}
    >
      {children}
    </AdminShell>
  )
}
