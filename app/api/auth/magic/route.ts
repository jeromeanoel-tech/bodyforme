import { NextResponse } from 'next/server'

// Magic login removed — use forgot-password flow instead
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
