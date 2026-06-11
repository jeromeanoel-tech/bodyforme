import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

const REAL_EMAILS = new Set([
  'bonny_au@outlook.com','armitahashemi07@gmail.com','baric_i@yahoo.com','gregburgess@fastmail.com',
  'lailaniburra@gmail.com','tiffaniecyy@gmail.com','mariachristofi__@hotmail.com','oclarke16@ford.com',
  'anabelcrake@icloud.com','enzodaquino1@optusnet.com.au','michelle.edws@gmail.com','marissa.enderby@icloud.com',
  'georgiafrey@gmail.com','jennifergip@gmail.com','rosalie.heckes@gmail.com','tchillier@gmail.com',
  'rajkakarla@live.com','hediyeh.karimi@gmail.com','kylie_keats@yahoo.com.au','f.e.klonek@gmail.com',
  'fattahi0410@gmail.com','lynda-kus@bigpond.com','monidlam@gmail.com','liangyu0210@hotmail.com',
  'swmloo@hotmail.com','malhotra.akshra@gmail.com','dymatahari@gmail.com','miltiadou@bigpond.com',
  'stephanie_monardo@hotmail.com','lauren.munari@gmail.com','rickyongsk@yahoo.com','nancyopasinis@gmail.com',
  'nadenespaul@gmail.com','kpkiki11@hotmail.com','stevenrigoni@gmail.com','bartsaaf@gmail.com',
  'sberna1@bigpond.com','robertasilluzio@jelliscraig.com.au','ifnotnowwhen1968@gmail.com','shoumyaat@gmail.com',
  'julia.mai.trinh@gmail.com','jtsang26@gmail.com','tina.tsang@yahoo.com.au','rit.tse@iclubb.com',
  'robertupton7@hotmail.com','yclyap@hotmail.com','karen_yau@hotmail.com','jack.zhuleyi@gmail.com',
  'jerome.a.noel@gmail.com',
])

function isRealMember(email: string) {
  if (REAL_EMAILS.has(email)) return true
  if (email.includes('@bodyforme.placeholder')) return true  // placeholder emails for members without email
  return false
}

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: members } = await supabase
    .from('members')
    .select('id, email, first_name, last_name, created_at, plan_override, credit_balance')
    .order('created_at', { ascending: true })

  if (!members) return NextResponse.json({ error: 'Could not fetch members' }, { status: 500 })

  // Find duplicates by normalised full name
  const byName: Record<string, typeof members> = {}
  for (const m of members) {
    const key = `${m.first_name} ${m.last_name}`.toLowerCase().trim()
    if (!byName[key]) byName[key] = []
    byName[key].push(m)
  }

  const duplicates = Object.entries(byName)
    .filter(([, rows]) => rows.length > 1)
    .map(([name, rows]) => ({ name, rows }))

  const testAccounts = members.filter(m => !isRealMember(m.email))

  return NextResponse.json({ total: members.length, duplicates, testAccounts })
}

export async function DELETE(req: NextRequest) {
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const purgeTest = new URL(req.url).searchParams.get('purge-test') === '1'

  const { data: members } = await supabase
    .from('members')
    .select('id, email, first_name, last_name, created_at, plan_override')
    .order('created_at', { ascending: true })

  if (!members) return NextResponse.json({ error: 'Could not fetch members' }, { status: 500 })

  const toDelete: string[] = []

  if (purgeTest) {
    // Delete any member whose email is not in the real members list and not a placeholder
    for (const m of members) {
      if (!isRealMember(m.email)) toDelete.push(m.id)
    }
  } else {
    // Group by normalised name — keep the LAST created (the import), delete the rest
    const byName: Record<string, typeof members> = {}
    for (const m of members) {
      const key = `${m.first_name} ${m.last_name}`.toLowerCase().trim()
      if (!byName[key]) byName[key] = []
      byName[key].push(m)
    }
    for (const rows of Object.values(byName)) {
      if (rows.length < 2) continue
      const sorted = [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at))
      toDelete.push(...sorted.slice(0, -1).map(r => r.id))
    }
  }

  if (toDelete.length === 0) return NextResponse.json({ deleted: 0, message: 'No targets found' })

  const { error } = await supabase.from('members').delete().in('id', toDelete)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ deleted: toDelete.length })
}
