import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/adminSession'
import { supabase } from '@/lib/supabase'
import ClassesClient from './ClassesClient'

export const revalidate = 0

function getInstructors(): string[] {
  try {
    const all = JSON.parse(process.env.ADMIN_CREDENTIALS ?? '[]') as { name: string }[]
    return all.map(u => u.name).filter(Boolean).sort()
  } catch { return [] }
}

export default async function AdminClassesPage() {
  const session = await getAdminSession()
  if (session?.role !== 'admin') redirect('/admin')

  const { data: rows } = await supabase
    .from('schedule_template')
    .select('*')
    .order('day')
    .order('start_time')

  return <ClassesClient initialRows={rows ?? []} instructors={getInstructors()} />
}
