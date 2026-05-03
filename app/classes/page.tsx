import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import Link from 'next/link'
import { classTypes, classesPage, studio } from '@/lib/content'
import { getSessions, getServices, type WixSession, type WixService } from '@/lib/wix'

export const metadata = {
  title: 'Classes & Schedule | BodyForme Pilates',
  description: 'Browse the BodyForme Pilates weekly timetable. Mat, Reformer, Barre and Sculpt classes in Doncaster.',
}

export const revalidate = 300  // refresh schedule every 5 minutes

const COLOR_MAP: Record<string, string> = {
  'mat':        'var(--sage)',
  'pilates':    'var(--sage)',
  'reformer':   'var(--rust)',
  'barre':      '#8a9ab0',
  'sculpt':     '#b0906a',
  'special':    '#b0906a',
}

function classColor(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val
  }
  return 'var(--rule)'
}

function fmt12(iso: string) {
  if (!iso) return ''
  const [, time] = iso.split('T')
  const [h, m] = time.split(':').map(Number)
  const ampm = h < 12 ? 'am' : 'pm'
  const h12 = h % 12 || 12
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function getWeekDays(date: Date): Date[] {
  const start = new Date(date)
  const day   = start.getDay()
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)) // Mon
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export default async function ClassesPage() {
  const today = new Date()
  const days  = getWeekDays(today)
  const from  = days[0].toISOString().slice(0, 10)
  const to    = days[6].toISOString().slice(0, 10)

  let sessions: WixSession[] = []
  let services: WixService[] = []
  try {
    ;[sessions, services] = await Promise.all([getSessions(from, to), getServices()])
  } catch {
    // fail gracefully — show empty timetable
  }

  const scheduleToName = Object.fromEntries(services.map(s => [s.scheduleId, s.name]))
  const todayStr       = today.toISOString().slice(0, 10)

  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── PAGE HERO ── */}
      <div style={{ background: 'var(--esp)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 48px 56px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,.4)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '28px', height: '1px', background: 'rgba(196,168,130,.5)', display: 'block' }} />
              {classesPage.eyebrow}
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(48px,5vw,72px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--linen)', letterSpacing: '-.01em' }}>
              {classesPage.heading}{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#c4a882' }}>{classesPage.headingItalic}</em>
            </h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '28px' }}>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.6)', lineHeight: 1.75 }}>
              {classesPage.desc}
            </p>
            <div style={{ display: 'flex', gap: '40px' }}>
              {classesPage.stats.map((s, i) => (
                <div key={i}>
                  <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '40px', fontWeight: 300, color: 'var(--linen)', lineHeight: 1, display: 'block' }}>{s.value}</span>
                  <span style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(244,237,225,.35)', marginTop: '4px', display: 'block' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── WEEK SCHEDULE ── */}
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 48px 80px' }}>
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 400, color: 'var(--esp)', margin: 0 }}>
            {days[0].toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}
            {' – '}
            {days[6].toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
          <Link
            href={studio.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--esp)', padding: '11px 24px', textDecoration: 'none', transition: 'background .2s' }}
          >
            Book online
          </Link>
        </div>

        {/* 7-col day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
          {days.map((day, di) => {
            const dayStr = day.toISOString().slice(0, 10)
            const isToday = dayStr === todayStr
            const daySessions = sessions
              .filter(s => s.start.startsWith(dayStr) && s.status !== 'CANCELLED')
              .sort((a, b) => a.start.localeCompare(b.start))

            return (
              <div key={di} style={{ background: isToday ? 'var(--canvas)' : 'var(--linen)', display: 'flex', flexDirection: 'column' }}>
                {/* Day header */}
                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--rule)', textAlign: 'left' }}>
                  <span style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                    {day.toLocaleDateString('en-AU', { weekday: 'short' })}
                  </span>
                  <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '26px', fontWeight: 300, color: isToday ? 'var(--brown)' : 'var(--text)', lineHeight: 1 }}>
                    {day.getDate()}
                    {isToday && (
                      <span style={{ fontSize: '8px', letterSpacing: '.12em', textTransform: 'uppercase', background: 'var(--brown)', color: 'var(--canvas)', padding: '2px 6px', fontWeight: 500, marginLeft: '6px', verticalAlign: 'middle' }}>Today</span>
                    )}
                  </span>
                </div>

                {/* Class slots */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--rule)', flex: 1 }}>
                  {daySessions.length === 0 ? (
                    <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                      <span style={{ width: '16px', height: '1px', background: 'var(--rule)', display: 'inline-block' }} />
                    </div>
                  ) : (
                    daySessions.map(s => {
                      const name = scheduleToName[s.scheduleId] ?? s.title
                      const color = classColor(name)
                      const isFull = s.bookedCount >= s.capacity
                      const isLow  = !isFull && s.capacity - s.bookedCount <= 3
                      return (
                        <div
                          key={s.id}
                          style={{ background: 'var(--canvas)', padding: '14px 16px', cursor: 'pointer', transition: 'background .15s', borderLeft: `3px solid ${color}` }}
                        >
                          <div style={{ fontSize: '10px', letterSpacing: '.08em', color: 'var(--muted)', marginBottom: '5px', fontWeight: 400 }}>
                            {fmt12(s.start)}
                          </div>
                          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '14px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.25, marginBottom: '8px' }}>
                            {name}
                          </div>
                          <div style={{ fontSize: '10px', color: isFull ? 'var(--muted)' : isLow ? 'var(--rust)' : 'var(--muted)', letterSpacing: '.04em', textDecoration: isFull ? 'line-through' : 'none' }}>
                            {isFull ? 'Full' : `${s.capacity - s.bookedCount} spots left`}
                          </div>
                          {!isFull && (
                            <a
                              href={studio.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ marginTop: '10px', display: 'block', width: '100%', fontSize: '9.5px', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', textAlign: 'center', color: 'var(--esp)', border: '1px solid var(--rule)', padding: '7px 0', transition: 'all .2s', cursor: 'pointer', background: 'transparent', textDecoration: 'none', fontFamily: 'var(--font-dm-sans)' }}
                            >
                              Book
                            </a>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── CLASS TYPE CARDS ── */}
      <div style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '72px 48px' }}>
          <ScrollReveal>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '52px' }}>
              <div>
                <div className="slbl">Class types</div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', margin: 0 }}>
                  What we <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>offer</em>
                </h2>
              </div>
              <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75, maxWidth: '300px', textAlign: 'right' }}>
                Every class is taught by a certified instructor in a group of no more than 12.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {classTypes.map((cls, i) => {
                const gradMap = ['linear-gradient(150deg,#c8b090 0%,#8a5e3a 100%)', 'linear-gradient(150deg,#b0b8a8 0%,#5a6850 100%)', 'linear-gradient(150deg,#b0b8c8 0%,#5a6880 100%)', 'linear-gradient(150deg,#b8a898 0%,#6a4838 100%)']
                return (
                  <div key={cls.slug} style={{ background: 'var(--linen)', display: 'grid', gridTemplateColumns: '280px 1fr', minHeight: '240px' }}>
                    <div style={{ background: gradMap[i % gradMap.length], position: 'relative', overflow: 'hidden', minHeight: '240px' }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 500, color: 'rgba(244,237,225,.8)', background: classColor(cls.name) + 'cc' }}>
                        {cls.name}
                      </div>
                    </div>
                    <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontSize: '11px', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '10px', display: 'block' }}>0{i + 1}</span>
                        <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '32px', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', marginBottom: '8px' }}>
                          {cls.name} {cls.nameItalic && <em style={{ fontStyle: 'italic', fontWeight: 300 }}>{cls.nameItalic}</em>}
                        </div>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '18px' }}>
                          {[cls.duration, cls.level].map(m => (
                            <span key={m} style={{ fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>{m}</span>
                          ))}
                        </div>
                        <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75 }}>{cls.desc}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '20px', borderTop: '1px solid var(--rule)', marginTop: '24px' }}>
                        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 300, color: 'var(--esp)' }}>
                          {cls.priceNote}
                        </span>
                        <Link
                          href={studio.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--esp)', padding: '11px 24px', textDecoration: 'none', transition: 'background .2s' }}
                        >
                          Book class
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: 'var(--esp)', marginTop: 0, padding: '60px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '48px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(28px,3vw,40px)', fontWeight: 300, color: 'var(--linen)', marginBottom: '8px' }}>
              {classesPage.ctaHeading}{' '}
              {classesPage.ctaHeadingItalic && <em style={{ fontStyle: 'italic', color: '#c4a882' }}>{classesPage.ctaHeadingItalic}</em>}
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(244,237,225,.55)', lineHeight: 1.6 }}>{classesPage.ctaBody}</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            <Link
              href="/memberships"
              style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--linen)', border: '1px solid rgba(255,255,255,.25)', padding: '13px 28px', textDecoration: 'none', display: 'inline-block', transition: 'border-color .2s' }}
            >
              View memberships
            </Link>
            <Link
              href="/free-trial"
              style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--esp)', background: 'var(--linen)', padding: '13px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background .2s' }}
            >
              Book free trial
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
