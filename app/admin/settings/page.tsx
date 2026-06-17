import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import SettingsClient from './SettingsClient'

export default async function AdminSettingsPage() {
  const session = await getAdminSession()
  if (session?.role !== 'admin') redirect('/admin')

  return <SettingsClient />
}
