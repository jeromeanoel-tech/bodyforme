import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import PosClient from './PosClient'

export const dynamic = 'force-dynamic'

export default async function PosPage() {
  const session = await getAdminSession()
  if (session?.role !== 'admin') redirect('/admin')
  return (
    <Suspense>
      <PosClient />
    </Suspense>
  )
}
