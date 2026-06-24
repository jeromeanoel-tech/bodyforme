/**
 * Replaces all Mon-Fri schedule_template rows with the canonical timetable.
 * Also renames Monday 5:45 pm sessions from "Pilates Hot Mat" → "Hot Mat Pilates".
 * Saturday and Sunday templates are already correct — left untouched.
 *
 * Run: npx tsx scripts/fix-template.ts
 */
import * as fs from 'fs'; import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
const e = path.join(process.cwd(), '.env.local')
if (fs.existsSync(e)) { for (const l of fs.readFileSync(e,'utf8').split('\n')) { const m=l.match(/^([^#=\s][^=]*)=(.*)$/); if(m){const k=m[1].trim(),v=m[2].trim().replace(/^"|"$/g,'');if(!process.env[k])process.env[k]=v}}}
const db = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL??'').replace(/\\n|\n/g,'').trim(),
  (process.env.SUPABASE_SECRET_KEY??'').replace(/\\n|\n/g,'').trim()
)

const CANONICAL: {day:string,start_time:string,end_time:string,class_name:string,instructor:string}[] = [
  // Monday
  { day:'monday',    start_time:'09:30', end_time:'10:30', class_name:'Hot Mat Pilates',                 instructor:'Suzanne' },
  { day:'monday',    start_time:'17:45', end_time:'18:45', class_name:'Hot Mat Pilates',                 instructor:'Sammy'   },
  { day:'monday',    start_time:'19:00', end_time:'20:30', class_name:'90min Bikram (Hot Yoga)',          instructor:'Gabe'    },
  // Tuesday
  { day:'tuesday',   start_time:'09:30', end_time:'10:30', class_name:'Arms Abs Glutes',                 instructor:'Suzanne' },
  { day:'tuesday',   start_time:'17:45', end_time:'18:45', class_name:'Arms Abs Glutes',                 instructor:'Suzanne' },
  { day:'tuesday',   start_time:'19:00', end_time:'19:45', class_name:'Hot Mat Pilates (Core)',           instructor:'Suzanne' },
  // Wednesday
  { day:'wednesday', start_time:'06:30', end_time:'07:15', class_name:'Arms Abs Glutes',                 instructor:'Mash'    },
  { day:'wednesday', start_time:'09:30', end_time:'10:30', class_name:'Hot Mat Pilates',                 instructor:'Suzanne' },
  { day:'wednesday', start_time:'17:45', end_time:'18:45', class_name:'Hot Mat',                         instructor:'Hiliory' },
  { day:'wednesday', start_time:'19:00', end_time:'19:45', class_name:'Power HIIT',                      instructor:'Hiliory' },
  // Thursday
  { day:'thursday',  start_time:'09:30', end_time:'10:15', class_name:'Tabata',                          instructor:'Suzanne' },
  { day:'thursday',  start_time:'17:45', end_time:'18:30', class_name:'Tabata',                          instructor:'Suzanne' },
  { day:'thursday',  start_time:'18:45', end_time:'19:45', class_name:'Arms Abs Glutes',                 instructor:'Mish'    },
  // Friday
  { day:'friday',    start_time:'06:30', end_time:'07:15', class_name:'Power HIIT',                      instructor:'Mish'    },
  { day:'friday',    start_time:'09:30', end_time:'10:30', class_name:'Hot Mat Pilates (Strength)',       instructor:'Sammy'   },
  { day:'friday',    start_time:'18:15', end_time:'19:15', class_name:'60min Bikram Express (Hot Yoga)',  instructor:'Gabe'    },
]

async function main() {
  console.log('\n══ Fix schedule_template (Mon–Fri) ══\n')

  // 1. Delete all Mon-Fri template rows
  const { error: delErr } = await db.from('schedule_template')
    .delete().in('day', ['monday','tuesday','wednesday','thursday','friday'])
  if (delErr) { console.error('Delete error:', delErr.message); process.exit(1) }
  console.log('Deleted all Mon-Fri template rows.')

  // 2. Insert canonical rows
  const { data: inserted, error: insErr } = await db.from('schedule_template')
    .insert(CANONICAL).select()
  if (insErr) { console.error('Insert error:', insErr.message); process.exit(1) }
  console.log(`Inserted ${inserted?.length} canonical rows.`)

  // 3. Rename Monday 5:45 pm sessions from "Pilates Hot Mat" → "Hot Mat Pilates"
  //    and switch them to the "Hot Mat Pilates" service_id
  const { data: hotMatSvc } = await db.from('services')
    .select('id').eq('name', 'Hot Mat Pilates').maybeSingle()
  if (!hotMatSvc) { console.warn('Could not find "Hot Mat Pilates" service — sessions not updated.'); }

  const { data: oldSvc } = await db.from('services')
    .select('id').eq('name', 'Pilates Hot Mat').maybeSingle()

  if (hotMatSvc && oldSvc) {
    // Find all future "Pilates Hot Mat" sessions on Mondays at 5:45 pm Melbourne
    const { data: pilateSessions } = await db.from('sessions')
      .select('id, title, start_time')
      .eq('service_id', oldSvc.id)
      .neq('status', 'CANCELLED')
      .gt('start_time', new Date().toISOString())

    const toUpdate = (pilateSessions ?? []).filter(s => {
      const parts = new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Melbourne',
        weekday: 'long', hour: '2-digit', minute: '2-digit', hour12: false,
      }).formatToParts(new Date(s.start_time))
      const weekday = parts.find(p => p.type==='weekday')?.value?.toLowerCase()
      const h  = parts.find(p => p.type==='hour')?.value ?? '00'
      const mi = parts.find(p => p.type==='minute')?.value ?? '00'
      return weekday === 'monday' && `${h.padStart(2,'0')}:${mi.padStart(2,'0')}` === '17:45'
    })

    if (toUpdate.length > 0) {
      await db.from('sessions')
        .update({ title: 'Hot Mat Pilates', service_id: hotMatSvc.id })
        .in('id', toUpdate.map(s => s.id))
      console.log(`\nRenamed ${toUpdate.length} Monday 5:45 pm sessions: "Pilates Hot Mat" → "Hot Mat Pilates"`)
    } else {
      console.log('\nNo "Pilates Hot Mat" Monday 5:45 pm sessions found to rename.')
    }
  } else {
    console.log('\nSkipping session rename (service not found).')
  }

  console.log('\n══ Done ══\n')
}
main().catch(err => { console.error('\nFatal:', err); process.exit(1) })
