import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\\n|\n/g, '').trim(),
  (process.env.SUPABASE_SECRET_KEY ?? '').replace(/\\n|\n/g, '').trim(),
)

function slotKey(utcIso: string): string {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(utcIso))
  const day = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? ''
  const h   = (parts.find(p => p.type === 'hour')?.value   ?? '0').padStart(2, '0')
  const mi  = (parts.find(p => p.type === 'minute')?.value ?? '0').padStart(2, '0')
  return `${day}:${h}:${mi}`
}

export async function GET() {
  const admin = await getAdminSession()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Fetch template
  const { data: template } = await supabase.from('schedule_template').select('*').eq('day', 'thursday')
  const templateNameBySlot = Object.fromEntries((template ?? []).map((r: { day: string; start_time: string; class_name: string }) => [`${r.day}:${r.start_time}`, r.class_name]))

  // Fetch next 4 weeks of sessions (not cancelled)
  const now = new Date().toISOString()
  const future = new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString()
  const { data: sessions } = await supabase.from('sessions')
    .select('id, title, start_time, end_time, status, service_id')
    .neq('status', 'CANCELLED')
    .gte('start_time', now)
    .lte('start_time', future)
    .order('start_time')

  // Annotate each session with Melbourne day/time and what would display
  const annotated = (sessions ?? []).map((s: { id: string; title: string; start_time: string; end_time: string; status: string; service_id: string }) => {
    const key = slotKey(s.start_time)
    const melbTime = new Date(s.start_time).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne', weekday: 'long', hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', hour12: true })
    return {
      id:           s.id,
      storedUtc:    s.start_time,
      melbTime,
      slotKey:      key,
      title:        s.title,
      service_id:   s.service_id,
      templateName: templateNameBySlot[key] ?? '(no match)',
      wouldDisplay: templateNameBySlot[key] ?? s.title,
    }
  }).filter((s: { slotKey: string }) => s.slotKey.startsWith('thursday'))

  return NextResponse.json({ template, templateNameBySlot, thursdaySessions: annotated })
}
