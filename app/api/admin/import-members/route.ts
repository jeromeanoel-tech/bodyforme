import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'
import { getAdminSession } from '@/lib/adminSession'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
)

type MemberRow = {
  firstName: string; lastName: string; email: string; phone: string
  plan: string; planOverride: string; credit: number
  startDate: string; endDate: string; notes: string
}

const MEMBERS: MemberRow[] = [
  { firstName:'Bonny',     lastName:'Au',           email:'bonny_au@outlook.com',               phone:'0481 326 838', plan:'6 Month Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-19', endDate:'2026-11-19', notes:'' },
  { firstName:'Armita',    lastName:'Azad',          email:'armitahashemi07@gmail.com',           phone:'0407 843 239', plan:'50 Class Pass',                   planOverride:'50-Class Pass',  credit:37, startDate:'2026-05-14', endDate:'2027-05-14', notes:'' },
  { firstName:'Irena',     lastName:'Baric',         email:'baric_i@yahoo.com',                  phone:'0429 117 974', plan:'Casual Class',                    planOverride:'casual',         credit:3,  startDate:'2026-05-21', endDate:'2026-06-21', notes:'' },
  { firstName:'Greg',      lastName:'Burgess',       email:'gregburgess@fastmail.com',            phone:'0477 120 683', plan:'Casual Class',                    planOverride:'casual',         credit:1,  startDate:'2026-05-23', endDate:'2026-06-23', notes:'' },
  { firstName:'Lailani',   lastName:'Burra',         email:'lailaniburra@gmail.com',              phone:'0418 135 181', plan:'Casual Class',                    planOverride:'casual',         credit:1,  startDate:'2026-05-21', endDate:'2026-06-21', notes:'Has an issue with her hip.' },
  { firstName:'Tiffanie',  lastName:'Cheung',        email:'tiffaniecyy@gmail.com',               phone:'0410 969 073', plan:'Casual Class',                    planOverride:'casual',         credit:2,  startDate:'2026-05-30', endDate:'2026-06-30', notes:'' },
  { firstName:'Maria',     lastName:'Christofi',     email:'mariachristofi__@hotmail.com',        phone:'0438 342 569', plan:'10 Class Pass',                   planOverride:'10-Class Pack',  credit:8,  startDate:'2026-05-25', endDate:'2026-06-25', notes:'Merged from two Mind Body accounts (same phone). 8 visits remaining.' },
  { firstName:'Ozlem',     lastName:'Clarke',        email:'oclarke16@ford.com',                 phone:'0411 134 707', plan:'20 Class Pass',                   planOverride:'20-Class Pack',  credit:6,  startDate:'2026-05-01', endDate:'2026-11-01', notes:'' },
  { firstName:'Annabel',   lastName:'Crake',         email:'anabelcrake@icloud.com',              phone:'0487 912 707', plan:'Monthly Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-07', endDate:'2026-06-07', notes:'' },
  { firstName:'Enzo',      lastName:"D'Aquino",      email:'enzodaquino1@optusnet.com.au',        phone:'0403 034 443', plan:'1 Year Unlimited',                planOverride:'Unlimited',      credit:0,  startDate:'2026-05-24', endDate:'2027-05-24', notes:'' },
  { firstName:'Michelle',  lastName:'Edwards',       email:'michelle.edws@gmail.com',             phone:'0402 419 340', plan:'Direct Debit Unlimited',          planOverride:'Unlimited',      credit:0,  startDate:'2026-06-08', endDate:'2026-08-10', notes:'' },
  { firstName:'Marissa',   lastName:'Enderby',       email:'marissa.enderby@icloud.com',          phone:'0433 828 259', plan:'Casual Class',                    planOverride:'casual',         credit:1,  startDate:'2026-05-31', endDate:'2026-06-30', notes:'' },
  { firstName:'Georgia',   lastName:'Frey',          email:'georgiafrey@gmail.com',               phone:'0452 062 611', plan:'Direct Debit 3 Classes/Week',     planOverride:'3 per week',     credit:0,  startDate:'2026-06-09', endDate:'2026-06-23', notes:'' },
  { firstName:'Jennifer',  lastName:'Gip',           email:'jennifergip@gmail.com',               phone:'0416 036 881', plan:'Monthly Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-06', endDate:'2026-06-06', notes:'' },
  { firstName:'Navid',     lastName:'Hassani',       email:'noemail.navid.hassani@bodyforme.placeholder', phone:'0413 456 969', plan:'Casual Class', planOverride:'casual', credit:1, startDate:'2026-05-28', endDate:'2026-06-28', notes:'⚠ No email on file — placeholder assigned.' },
  { firstName:'Rosie',     lastName:'Heckes',        email:'rosalie.heckes@gmail.com',            phone:'0491 029 353', plan:'10 Class Pass',                   planOverride:'10-Class Pack',  credit:8,  startDate:'2026-05-18', endDate:'2026-06-18', notes:'' },
  { firstName:'Tania',     lastName:'Hillier',       email:'tchillier@gmail.com',                 phone:'0403 190 843', plan:'6 Month Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-07', endDate:'2026-11-07', notes:'' },
  { firstName:'Jassmin',   lastName:'Jong',          email:'noemail.jassmin.jong@bodyforme.placeholder', phone:'', plan:'Casual Class', planOverride:'casual', credit:1, startDate:'2026-05-30', endDate:'2026-06-30', notes:'⚠ No email or phone on file — placeholder assigned.' },
  { firstName:'Raj',       lastName:'Kakarla',       email:'rajkakarla@live.com',                 phone:'0402 971 237', plan:'Direct Debit Unlimited',          planOverride:'Unlimited',      credit:0,  startDate:'2026-06-08', endDate:'2026-08-03', notes:'' },
  { firstName:'Heidi',     lastName:'Karimi',        email:'hediyeh.karimi@gmail.com',            phone:'0492 865 234', plan:'ClassPass',                       planOverride:'casual',         credit:4,  startDate:'2026-05-19', endDate:'2026-08-19', notes:'ClassPass member — 4 visits remaining.' },
  { firstName:'Kylie',     lastName:'Keats',         email:'kylie_keats@yahoo.com.au',            phone:'0432 534 984', plan:'6 Month Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-05', endDate:'2026-11-05', notes:'' },
  { firstName:'Florian',   lastName:'Klonek',        email:'f.e.klonek@gmail.com',                phone:'0472 996 562', plan:'Casual Class',                    planOverride:'casual',         credit:1,  startDate:'2026-05-16', endDate:'2026-06-16', notes:'' },
  { firstName:'Alena',     lastName:'Krasnopeera',   email:'fattahi0410@gmail.com',               phone:'0457 108 665', plan:'New Student Intro Pass',          planOverride:'intro-offer',    credit:3,  startDate:'2026-05-25', endDate:'2026-05-31', notes:'Intro pass — may have expired.' },
  { firstName:'Lynda',     lastName:'Kus',           email:'lynda-kus@bigpond.com',               phone:'0413 952 880', plan:'Monthly Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-19', endDate:'2026-06-19', notes:'' },
  { firstName:'Monid',     lastName:'Lam',           email:'monidlam@gmail.com',                  phone:'0411 411 031', plan:'6 Month Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-14', endDate:'2026-11-14', notes:'' },
  { firstName:'Foria',     lastName:'Liang',         email:'liangyu0210@hotmail.com',             phone:'0430 420 210', plan:'Direct Debit 3 Classes/Week',     planOverride:'3 per week',     credit:0,  startDate:'2026-06-08', endDate:'2026-08-31', notes:'' },
  { firstName:'Siew Mei',  lastName:'Loo',           email:'swmloo@hotmail.com',                  phone:'0410 533 139', plan:'Direct Debit Unlimited',          planOverride:'Unlimited',      credit:0,  startDate:'2026-06-08', endDate:'2026-07-27', notes:'' },
  { firstName:'Akshra',    lastName:'Malhotra',      email:'malhotra.akshra@gmail.com',           phone:'0481 182 028', plan:'Direct Debit 3 Classes/Week',     planOverride:'3 per week',     credit:0,  startDate:'2026-06-08', endDate:'2026-08-31', notes:'' },
  { firstName:'Dina',      lastName:'Mendez',        email:'dymatahari@gmail.com',                phone:'',             plan:'Welcome Back Pass',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-28', endDate:'2026-06-10', notes:'Welcome Back Pass — may have expired.' },
  { firstName:'Dubravka',  lastName:'Miltiadou',     email:'miltiadou@bigpond.com',               phone:'0423 969 473', plan:'Direct Debit 3 Classes/Week',     planOverride:'3 per week',     credit:0,  startDate:'2026-06-10', endDate:'2026-06-17', notes:'2 of 3 weekly visits remaining for current period.' },
  { firstName:'Stephanie', lastName:'Monardo',       email:'stephanie_monardo@hotmail.com',       phone:'0414 947 821', plan:'Monthly Studio Membership',       planOverride:'Unlimited',      credit:0,  startDate:'2026-06-02', endDate:'2026-10-02', notes:'' },
  { firstName:'Lauren',    lastName:'Munari',        email:'lauren.munari@gmail.com',             phone:'0401 423 466', plan:'Casual Class',                    planOverride:'casual',         credit:1,  startDate:'2026-05-28', endDate:'2026-06-28', notes:'Owes from 23/1/20. Slipped disc in lumbar spine — surgery ~Dec 2019. Modify exercises accordingly.' },
  { firstName:'Rickyi',    lastName:'Ong',           email:'rickyongsk@yahoo.com',                phone:'0426 839 938', plan:'Casual Class',                    planOverride:'casual',         credit:1,  startDate:'2026-05-30', endDate:'2026-06-30', notes:'' },
  { firstName:'Nancy',     lastName:'Opasinis',      email:'nancyopasinis@gmail.com',             phone:'0409 339 986', plan:'Direct Debit 3 Classes/Week',     planOverride:'3 per week',     credit:0,  startDate:'2026-06-05', endDate:'2026-07-31', notes:'' },
  { firstName:'Nadene',    lastName:'Paul',          email:'nadenespaul@gmail.com',               phone:'0419 885 101', plan:'6 Month Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-14', endDate:'2026-11-14', notes:'' },
  { firstName:'Kristy',    lastName:'Pennant',       email:'kpkiki11@hotmail.com',                phone:'0431 329 659', plan:'Monthly Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-12', endDate:'2026-06-12', notes:'' },
  { firstName:'Steven',    lastName:'Rigoni',        email:'stevenrigoni@gmail.com',              phone:'0409 181 413', plan:'Monthly Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-19', endDate:'2026-06-19', notes:'' },
  { firstName:'Bart',      lastName:'Saaf',          email:'bartsaaf@gmail.com',                  phone:'0438 317 893', plan:'6 Month Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-08', endDate:'2026-11-08', notes:'' },
  { firstName:'Paul',      lastName:'Sberna',        email:'sberna1@bigpond.com',                 phone:'0414 315 728', plan:'50 Class Pass',                   planOverride:'50-Class Pass',  credit:43, startDate:'2026-05-09', endDate:'2027-05-09', notes:'' },
  { firstName:'Roberta',   lastName:'Silluzio',      email:'robertasilluzio@jelliscraig.com.au',  phone:'0412 454 050', plan:'Monthly Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-19', endDate:'2026-06-19', notes:'' },
  { firstName:'Jim',       lastName:'Sovolos',       email:'ifnotnowwhen1968@gmail.com',          phone:'0402 405 181', plan:'Monthly Studio Membership',       planOverride:'Unlimited',      credit:0,  startDate:'2026-05-17', endDate:'2026-11-17', notes:'' },
  { firstName:'Shoumyaa',  lastName:'Thanaskanda',   email:'shoumyaat@gmail.com',                 phone:'0488 328 733', plan:'Casual Class',                    planOverride:'casual',         credit:1,  startDate:'2026-05-31', endDate:'2026-06-30', notes:'' },
  { firstName:'Mai',       lastName:'Trinh',         email:'julia.mai.trinh@gmail.com',           phone:'0432 229 080', plan:'Monthly Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-12', endDate:'2026-06-12', notes:'' },
  { firstName:'Jessica',   lastName:'Tsang',         email:'jtsang26@gmail.com',                  phone:'0401 995 974', plan:'Direct Debit 3 Classes/Week',     planOverride:'3 per week',     credit:0,  startDate:'2026-06-08', endDate:'2026-08-24', notes:'Had trouble signing in online — check portal access.' },
  { firstName:'Tina',      lastName:'Tsang',         email:'tina.tsang@yahoo.com.au',             phone:'0423 762 762', plan:'Monthly Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-01', endDate:'2026-06-01', notes:'' },
  { firstName:'Rit',       lastName:'Tse',           email:'rit.tse@iclubb.com',                  phone:'0401 384 441', plan:'Monthly Unlimited',               planOverride:'Unlimited',      credit:0,  startDate:'2026-05-01', endDate:'2026-06-01', notes:'' },
  { firstName:'Robert',    lastName:'Upton',         email:'robertupton7@hotmail.com',            phone:'0422 259 411', plan:'Monthly Studio Membership',       planOverride:'Unlimited',      credit:0,  startDate:'2026-05-29', endDate:'2027-04-27', notes:'' },
  { firstName:'Choy Leng', lastName:'Yap',           email:'yclyap@hotmail.com',                  phone:'0481 222 079', plan:'Direct Debit Unlimited',          planOverride:'Unlimited',      credit:0,  startDate:'2026-05-31', endDate:'2026-06-06', notes:'' },
  { firstName:'Karen',     lastName:'Yau',           email:'karen_yau@hotmail.com',               phone:'0412 661 226', plan:'Monthly Studio Membership',       planOverride:'Unlimited',      credit:0,  startDate:'2026-06-04', endDate:'2026-11-04', notes:'' },
  { firstName:'Ping',      lastName:'Yu',            email:'jack.zhuleyi@gmail.com',              phone:'0432 777 079', plan:'10 Class Pass',                   planOverride:'10-Class Pack',  credit:8,  startDate:'2026-05-21', endDate:'2026-08-21', notes:'' },
  // June sign-ups (no emails available from source data)
  { firstName:'Ya Ping',   lastName:'Chan',          email:'noemail.yapingchan@bodyforme.placeholder',     phone:'', plan:'Direct Debit 3 Classes/Week', planOverride:'3 per week', credit:0, startDate:'2026-06-06', endDate:'2026-06-27', notes:'⚠ No email on file.' },
  { firstName:'Linda',     lastName:'Chiang',        email:'noemail.lindachiang@bodyforme.placeholder',    phone:'', plan:'Direct Debit 3 Classes/Week', planOverride:'3 per week', credit:0, startDate:'2026-03-18', endDate:'2028-06-29', notes:'⚠ No email on file. Long-term DD since Mar 2025.' },
  { firstName:'Sarah',     lastName:'Dick',          email:'noemail.sarahdick@bodyforme.placeholder',      phone:'', plan:'Direct Debit 3 Classes/Week', planOverride:'3 per week', credit:0, startDate:'2026-06-08', endDate:'2026-08-03', notes:'⚠ No email on file.' },
  { firstName:'David',     lastName:'Macfarlane',    email:'noemail.davidmacfarlane@bodyforme.placeholder', phone:'', plan:'Direct Debit 3 Classes/Week', planOverride:'3 per week', credit:0, startDate:'2026-06-10', endDate:'2026-07-07', notes:'⚠ No email on file.' },
  { firstName:'Emma Dal',  lastName:'Maso',          email:'noemail.emmadalmaso@bodyforme.placeholder',    phone:'', plan:'Direct Debit 3 Classes/Week', planOverride:'3 per week', credit:0, startDate:'2026-06-09', endDate:'2026-08-25', notes:'⚠ No email on file.' },
  { firstName:'Vanessa',   lastName:'Thompson',      email:'noemail.vanessathompson@bodyforme.placeholder', phone:'', plan:'Direct Debit 3 Classes/Week', planOverride:'3 per week', credit:0, startDate:'2026-06-09', endDate:'2026-09-01', notes:'⚠ No email on file.' },
  { firstName:'Meng Yee',  lastName:'Yem',           email:'noemail.mengyeeyem@bodyforme.placeholder',     phone:'', plan:'Direct Debit 3 Classes/Week', planOverride:'3 per week', credit:0, startDate:'2026-06-09', endDate:'2026-08-25', notes:'⚠ No email on file.' },
]

export async function POST(req: NextRequest) {
  // Auth check — admin only
  const session = await getAdminSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const force = req.nextUrl.searchParams.get('force') === '1'

  // Guard: don't double-import
  const { count } = await supabase.from('members').select('*', { count: 'exact', head: true })
  if ((count ?? 0) > 5 && !force) {
    return NextResponse.json({
      error: `${count} members already exist. Add ?force=1 to re-run.`,
      count,
    }, { status: 409 })
  }

  const placeholderHash = await bcrypt.hash(process.env.MEMBER_PLACEHOLDER_PASSWORD ?? 'changeme', 8)
  const results: { name: string; status: string; error?: string }[] = []

  for (const m of MEMBERS) {
    const email = m.email.toLowerCase()

    const { data: existing } = await supabase
      .from('members').select('id').eq('email', email).single()

    if (existing && !force) {
      results.push({ name: `${m.firstName} ${m.lastName}`, status: 'skipped' })
      continue
    }

    const upsertPayload: Record<string, unknown> = {
      email,
      first_name:     m.firstName,
      last_name:      m.lastName,
      phone:          m.phone,
      status:         'active',
      plan_override:  m.planOverride,
      credit_balance: m.credit,
      admin_notes:    m.notes,
    }
    if (!existing) upsertPayload.password_hash = placeholderHash

    const { data: member, error: memberErr } = await supabase
      .from('members')
      .upsert(upsertPayload, { onConflict: 'email' })
      .select('id')
      .single()

    if (memberErr || !member) {
      results.push({ name: `${m.firstName} ${m.lastName}`, status: 'error', error: memberErr?.message })
      continue
    }

    if (!existing || force) {
      // Upsert — not insert — so force re-runs don't create duplicate membership rows
      await supabase.from('memberships').upsert({
        member_id:  member.id,
        plan_id:    m.planOverride.toLowerCase().replace(/[\s/]+/g, '-'),
        plan_name:  m.plan,
        status:     'ACTIVE',
        start_date: m.startDate,
        end_date:   m.endDate,
      }, { onConflict: 'member_id' })
    }

    results.push({ name: `${m.firstName} ${m.lastName}`, status: existing ? 'updated' : 'created' })
  }

  const created = results.filter(r => r.status === 'created').length
  const updated = results.filter(r => r.status === 'updated').length
  const skipped = results.filter(r => r.status === 'skipped').length
  const errors  = results.filter(r => r.status === 'error').length

  return NextResponse.json({ summary: { created, updated, skipped, errors, total: MEMBERS.length }, results })
}
