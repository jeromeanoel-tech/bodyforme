import { NextRequest, NextResponse } from 'next/server'
import { getMemberByContactId } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const contactId = req.nextUrl.searchParams.get('contactId')
  if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 })

  const member = await getMemberByContactId(contactId)
  return NextResponse.json({ member })
}
