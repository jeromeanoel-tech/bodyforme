import { NextRequest, NextResponse } from 'next/server'
import { getSessions, getServices, getStaff } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'Missing from/to' }, { status: 400 })
  }

  const [sessions, services, staff] = await Promise.all([
    getSessions(from, to),
    getServices(),
    getStaff(),
  ])

  const scheduleToName  = Object.fromEntries(services.map(s => [s.scheduleId, s.name]))
  const resourceToStaff = Object.fromEntries(staff.map(s => [s.resourceId, s.name]))

  return NextResponse.json(
    { sessions, scheduleToName, resourceToStaff },
    { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' } }
  )
}
