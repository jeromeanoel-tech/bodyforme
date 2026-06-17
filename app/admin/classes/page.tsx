import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import { createClient } from '@supabase/supabase-js'
import ClassesClient from './ClassesClient'

export const revalidate = 30

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

export default async function AdminClassesPage() {
  const session = await getAdminSession()
  if (session?.role !== 'admin') redirect('/admin')

  const { data: services } = await supabase
    .from('services')
    .select('id, name, description, duration, capacity')
    .order('name')

  const now = new Date().toISOString()
  const { data: sessionCounts } = await supabase
    .from('sessions')
    .select('service_id')
    .gte('start_time', now)
    .neq('status', 'CANCELLED')

  const countMap: Record<string, number> = {}
  ;(sessionCounts ?? []).forEach((s: { service_id: string }) => {
    countMap[s.service_id] = (countMap[s.service_id] ?? 0) + 1
  })

  const servicesWithCounts = (services ?? []).map((s: { id: string; name: string; description: string; duration: number; capacity: number }) => ({
    ...s,
    upcomingSessions: countMap[s.id] ?? 0,
  }))

  return <ClassesClient initialServices={servicesWithCounts} />
}
