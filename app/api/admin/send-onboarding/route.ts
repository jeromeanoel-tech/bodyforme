import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

const BASE          = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bodyforme.com.au'
const RESEND_KEY    = process.env.RESEND_API_KEY!
const FROM_ADDRESS  = 'BodyForme Studio <hello@bodyforme.com.au>'
const PLACEHOLDER_RE = /\.placeholder$/

export async function POST(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({})) as { confirmed?: boolean }
  const { data: members, error } = await supabase
    .from('members')
    .select('id, email, first_name')
    .order('first_name', { ascending: true })

  if (error || !members) return NextResponse.json({ error: 'Could not fetch members' }, { status: 500 })

  // Skip placeholder emails
  const targets = members.filter(m => m.email && !PLACEHOLDER_RE.test(m.email))

  // Safety guard — require explicit confirmation to prevent accidental double-sends
  if (!body.confirmed) {
    return NextResponse.json({
      preview: true,
      total: targets.length,
      message: `This will send onboarding emails to ${targets.length} member${targets.length !== 1 ? 's' : ''}. POST with { confirmed: true } to proceed.`,
    })
  }

  const results: { email: string; ok: boolean; error?: string }[] = []

  for (const m of targets) {
    try {
      const res = await fetch(`${BASE}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-internal-key': process.env.INTERNAL_EMAIL_KEY ?? process.env.STRIPE_WEBHOOK_SECRET ?? '' },
        body: JSON.stringify({
          to: m.email,
          template: 'member-onboarding',
          vars: { firstName: m.first_name ?? 'there' },
        }),
      })
      if (res.ok) {
        results.push({ email: m.email, ok: true })
      } else {
        const err = await res.text()
        results.push({ email: m.email, ok: false, error: err })
      }
    } catch (e) {
      results.push({ email: m.email, ok: false, error: String(e) })
    }
    // Small delay to stay under Resend's 2 req/s rate limit
    await new Promise(r => setTimeout(r, 600))
  }

  const sent   = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length

  return NextResponse.json({ sent, failed, total: targets.length, results })
}
