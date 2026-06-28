import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { getSystemErrors } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const errors = await getSystemErrors(100)
  return NextResponse.json({ errors })
}
