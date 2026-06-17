import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import MarketingClient from './MarketingClient'

export default async function AdminMarketingPage() {
  const session = await getAdminSession()
  if (session?.role !== 'admin') redirect('/admin')

  return <MarketingClient />
}
