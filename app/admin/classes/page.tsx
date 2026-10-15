import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import { supabase } from '@/lib/supabase'
import { getStaffNames } from '@/lib/db'
import ClassesClient from './ClassesClient'

export const revalidate = 0

function credentialNames(): string[] {
  try {
    const all = JSON.parse(process.env.ADMIN_CREDENTIALS ?? '[]') as { name: string }[]
    return all.map(u => u.name).filter(Boolean).sort()
  } catch { return [] }
}

export default async function AdminClassesPage() {
  const session = await getAdminSession()
  if (session?.role !== 'admin') redirect('/admin')

  const [{ data: rows }, staffNames] = await Promise.all([
    supabase.from('schedule_template').select('*').order('day').order('start_time'),
    getStaffNames(),
  ])

  // Use staff table if populated; fall back to ADMIN_CREDENTIALS for backwards compat
  const instructors = staffNames.length > 0 ? staffNames : credentialNames()

  return <ClassesClient initialRows={rows ?? []} instructors={instructors} />
}
