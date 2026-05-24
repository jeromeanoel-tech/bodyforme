import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// ONE-TIME SEEDING ENDPOINT — DELETE AFTER USE
// Protected by MIGRATE_SECRET

const SCHEDULE = [
  { day: 1, startH: 9,  startM: 30, endH: 10, endM: 30, title: 'Hot Pilates',            instructor: 'Sam' },
  { day: 1, startH: 17, startM: 45, endH: 18, endM: 45, title: 'Hot Pilates',            instructor: 'Suzanne' },
  { day: 1, startH: 19, startM: 0,  endH: 20, endM: 30, title: 'Bikram 90 min',          instructor: 'Gabriel' },
  { day: 2, startH: 9,  startM: 30, endH: 10, endM: 30, title: 'AAA (Arms Abs Ass)',     instructor: 'Suzanne' },
  { day: 2, startH: 17, startM: 45, endH: 18, endM: 45, title: 'AAA (Arms Abs Ass)',     instructor: 'Suzanne' },
  { day: 2, startH: 19, startM: 0,  endH: 19, endM: 45, title: 'Special Forces',         instructor: 'Suzanne' },
  { day: 3, startH: 6,  startM: 30, endH: 7,  endM: 15, title: 'AAA (Arms Abs Ass)',     instructor: 'Mish' },
  { day: 3, startH: 9,  startM: 30, endH: 10, endM: 30, title: 'Hot Pilates',            instructor: 'Suzanne' },
  { day: 3, startH: 17, startM: 45, endH: 18, endM: 45, title: 'Hot Pilates',            instructor: 'Hiliory' },
  { day: 3, startH: 19, startM: 0,  endH: 19, endM: 45, title: 'Hot HIIT',               instructor: 'Hiliory' },
  { day: 4, startH: 9,  startM: 30, endH: 10, endM: 30, title: 'Tabata',                 instructor: 'Suzanne' },
  { day: 4, startH: 17, startM: 45, endH: 18, endM: 30, title: 'Boxing HIIT',            instructor: 'Alex' },
  { day: 4, startH: 18, startM: 45, endH: 19, endM: 45, title: 'AAA (Arms Abs Ass)',     instructor: 'Mish' },
  { day: 5, startH: 6,  startM: 30, endH: 7,  endM: 15, title: 'Power HIIT',             instructor: 'Mish' },
  { day: 5, startH: 9,  startM: 30, endH: 10, endM: 30, title: 'Hot Pilates',            instructor: 'Suzanne' },
  { day: 5, startH: 18, startM: 15, endH: 19, endM: 15, title: 'Bikram Express',         instructor: 'Gabriel' },
  { day: 6, startH: 8,  startM: 0,  endH: 9,  endM: 0,  title: 'Sculpt Yoga',            instructor: 'Stephanie' },
  { day: 6, startH: 15, startM: 30, endH: 16, endM: 30, title: 'Silent Bikram Express',  instructor: 'Mish' },
  { day: 0, startH: 8,  startM: 0,  endH: 9,  endM: 0,  title: 'Hot Pilates',            instructor: 'Suzanne' },
  { day: 0, startH: 9,  startM: 15, endH: 10, endM: 45, title: 'Bikram 90 min',          instructor: 'Mish' },
  { day: 0, startH: 17, startM: 0,  endH: 18, endM: 0,  title: 'Yin Yoga',               instructor: 'Sam' },
]

function getMondayOfCurrentWeek(tz = 'Australia/Melbourne'): Date {
  const now  = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  const diff = now.getDay() === 0 ? -6 : 1 - now.getDay()
  now.setDate(now.getDate() + diff)
  now.setHours(0, 0, 0, 0)
  return now
}

function sessionDate(monday: Date, dayOfWeek: number, h: number, m: number): string {
  const d = new Date(monday)
  // day: 1=Mon…6=Sat, 0=Sun → offset from Monday
  const offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  d.setDate(d.getDate() + offset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export async function POST(req: NextRequest) {
  const auth   = req.headers.get('authorization') ?? ''
  const secret = process.env.MIGRATE_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const weeksParam = new URL(req.url).searchParams.get('weeks')
  const weeks = Math.min(parseInt(weeksParam ?? '12') || 12, 24)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  )

  // Ensure all services exist
  const uniqueTitles = [...new Set(SCHEDULE.map(s => s.title))]
  const serviceMap   = new Map<string, string>()

  for (const title of uniqueTitles) {
    const { data: existing } = await supabase.from('services').select('id').eq('name', title).single()
    if (existing) { serviceMap.set(title, existing.id); continue }
    const { data, error } = await supabase.from('services')
      .insert({ name: title, description: '', duration: 60, capacity: 20 })
      .select('id').single()
    if (error) return NextResponse.json({ error: `Service "${title}": ${error.message}` }, { status: 500 })
    serviceMap.set(title, data.id)
  }

  const monday = getMondayOfCurrentWeek()
  let inserted = 0, skipped = 0

  for (let week = 0; week < weeks; week++) {
    const weekStart = new Date(monday)
    weekStart.setDate(monday.getDate() + week * 7)

    for (const cls of SCHEDULE) {
      const startISO  = sessionDate(weekStart, cls.day, cls.startH, cls.startM)
      const endISO    = sessionDate(weekStart, cls.day, cls.endH,   cls.endM)
      const serviceId = serviceMap.get(cls.title)!

      const { data: exists } = await supabase.from('sessions')
        .select('id').eq('title', cls.title).eq('instructor_name', cls.instructor).eq('start_time', startISO).single()
      if (exists) { skipped++; continue }

      const { error } = await supabase.from('sessions').insert({
        service_id: serviceId, title: cls.title, instructor_name: cls.instructor,
        start_time: startISO, end_time: endISO, capacity: 20, status: 'CONFIRMED',
      })
      if (error) return NextResponse.json({ error: `Session ${cls.title} ${startISO}: ${error.message}` }, { status: 500 })
      inserted++
    }
  }

  return NextResponse.json({ ok: true, inserted, skipped, weeks })
}
