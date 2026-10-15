import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/adminSession'
import { createStaffMember, deleteStaffMember, getStaffRows } from '@/lib/db'

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const staff = await getStaffRows()
  return NextResponse.json({ staff })
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { name, email } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  try {
    await createStaffMember(name, email)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    const msg = (e as { message?: string })?.message ?? 'Failed to create'
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'An instructor with that name already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await deleteStaffMember(id)
  return NextResponse.json({ ok: true })
}
