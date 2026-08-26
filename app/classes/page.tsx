import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import ClassAccordion from '@/components/ClassAccordion'
import ScheduleAccordion from '@/components/ScheduleAccordion'
import Link from 'next/link'
import { classTypes, classesPage, studio } from '@/lib/content'
type ClassType = { slug: string; name: string; nameItalic?: string; tags?: string[]; desc: string; priceNote?: string }
import { getSessionsThisWeek, type TemplateRow } from '@/lib/db'

export const metadata = {
  title:       'Classes & Schedule | BodyForme Pilates',
  description: 'Browse the BodyForme weekly timetable. Hot Pilates, Bikram, Hot HIIT, Tabata, Yin Yoga, Special Forces and more in Doncaster.',
}

export const dynamic = 'force-dynamic'

const COLOR_MAP: Record<string, string> = {
  'bikram':      'var(--sage)',
  'yin':         'var(--sage)',
  'hot pilates': 'var(--rust)',
  'hot hiit':    '#8a6a50',
  'tabata':      '#8a6a50',
  'special':     '#7a8898',
  'aaa':         '#7a6858',
  'pilates':     'var(--rust)',
}

function classColor(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, val] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return val
  }
  return 'var(--blt)'
}

function fmt12(hhmm: string) {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const period = h < 12 ? 'am' : 'pm'
  const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
  thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}
const DAY_FULL: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

const DAYS_ORDER = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']

export default async function ClassesPage() {
  let rows: TemplateRow[] = []
  try {
    rows = await getSessionsThisWeek()
  } catch {
    // fail gracefully
  }

  const byDay: Record<string, TemplateRow[]> = {}
  for (const day of DAYS_ORDER) byDay[day] = []
  for (const r of rows) if (DAYS_ORDER.includes(r.day)) byDay[r.day].push(r)

  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── PAGE HERO ── */}
      <div style={{ background: 'var(--esp)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div
          className="r2 sp"
          style={{ maxWidth: '1320px', margin: '0 auto', padding: '72px 48px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'end' }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9.5px', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(244,237,225,.35)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '28px', height: '1px', background: 'rgba(196,168,130,.4)', display: 'block' }} />
              {classesPage.eyebrow}
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(48px,5.5vw,78px)', fontWeight: 400, lineHeight: 1.03, color: 'var(--linen)', letterSpacing: '-.02em' }}>
              {classesPage.heading}{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#c4a882' }}>{classesPage.headingItalic}</em>
            </h1>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '32px' }}>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.55)', lineHeight: 1.85 }}>
              {classesPage.desc}
            </p>
            <div style={{ display: 'flex', gap: '40px' }}>
              {classesPage.stats.map((s, i) => (
                <div key={i}>
                  <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '42px', fontWeight: 300, color: 'var(--linen)', lineHeight: 1, display: 'block' }}>{s.value}</span>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(244,237,225,.32)', marginTop: '6px', display: 'block' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── WEEK SCHEDULE ── */}
      <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '48px 48px 88px' }}>
        <div style={{ marginBottom: '36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="slbl" style={{ marginBottom: '8px' }}>Weekly timetable</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '32px', fontWeight: 400, color: 'var(--esp)', margin: 0 }}>
              This week&apos;s <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>schedule</em>
            </h2>
          </div>
          <Link
            href={studio.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            Book online
          </Link>
        </div>

        {/* Desktop: 7-col grid */}
        <div className="sched-wrap desk-only">
          <div
            className="sched-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}
          >
            {DAYS_ORDER.map(day => {
              const daySessions = byDay[day] ?? []
              return (
                <div key={day} style={{ background: 'var(--canvas)', display: 'flex', flexDirection: 'column' }}>
                  {/* Day header */}
                  <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--rule)', background: 'var(--linen)' }}>
                    <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '16px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1 }}>
                      {DAY_FULL[day]}
                    </span>
                  </div>
                  {/* Sessions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--rule)', flex: 1 }}>
                    {daySessions.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', background: 'var(--canvas)' }}>
                        <span style={{ width: '16px', height: '1px', background: 'var(--rule)', display: 'inline-block' }} />
                      </div>
                    ) : (
                      daySessions.map(r => {
                        const color = classColor(r.className)
                        return (
                          <div
                            key={r.id}
                            style={{ background: 'var(--canvas)', padding: '14px 14px 14px 16px', borderLeft: `3px solid ${color}` }}
                          >
                            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9.5px', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: '5px', fontWeight: 400 }}>
                              {fmt12(r.start)}
                            </div>
                            <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '14px', fontWeight: 400, color: 'var(--text)', lineHeight: 1.25, marginBottom: '10px' }}>
                              {r.className}
                            </div>
                            <a
                              href={studio.bookingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="sched-book-btn"
                            >
                              Book
                            </a>
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

        {/* Mobile: accordion */}
        <div className="mob-only">
          <ScheduleAccordion byDay={byDay} bookingUrl={studio.bookingUrl} />
        </div>
      </div>

      {/* ── CLASS TYPE CARDS ── */}
      <div style={{ borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', background: 'var(--l2)' }}>
        <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '80px 48px' }}>
          <ScrollReveal>
            <div className="rflex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px' }}>
              <div>
                <div className="slbl">Class types</div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', margin: 0 }}>
                  What we <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>offer</em>
                </h2>
              </div>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, maxWidth: '280px', textAlign: 'right' }}>
                Every class is taught by a certified instructor in a group of no more than 12.
              </p>
            </div>
          </ScrollReveal>

          {/* Desktop: 2-col grid */}
          <ScrollReveal>
            <div className="r2c desk-only" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {classTypes.map((cls, i) => {
                const isLastOdd = i === classTypes.length - 1 && classTypes.length % 2 !== 0
                return (
                  <div
                    key={cls.slug}
                    style={{
                      background: 'var(--canvas)',
                      ...(isLastOdd ? { gridColumn: '1 / -1', maxWidth: '50%' } : {}),
                    }}
                  >
                    <div style={{ padding: '36px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', letterSpacing: '.1em', color: 'var(--muted)', marginBottom: '12px', display: 'block' }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '34px', fontWeight: 400, lineHeight: 1.08, color: 'var(--esp)', marginBottom: '14px' }}>
                          {cls.name} {cls.nameItalic && <em style={{ fontStyle: 'italic', fontWeight: 300 }}>{cls.nameItalic}</em>}
                        </div>
                        {'tags' in cls && Array.isArray(cls.tags) && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                            {(cls.tags as string[]).map((tag, ti) => (
                              <span key={tag} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--blt)', fontWeight: 500 }}>
                                {ti > 0 && <span style={{ color: 'var(--rule)', marginRight: '8px' }}>·</span>}{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85 }}>{cls.desc}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '24px', borderTop: '1px solid var(--rule)', marginTop: '28px' }}>
                        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 300, color: 'var(--esp)' }}>
                          {cls.priceNote}
                        </span>
                        <Link
                          href={studio.bookingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary"
                          style={{ padding: '11px 24px' }}
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

          {/* Mobile: accordion */}
          <div className="mob-only">
            <ClassAccordion classes={classTypes as ClassType[]} bookingUrl={studio.bookingUrl} />
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="sp" style={{ background: 'var(--esp)', padding: '72px 48px' }}>
        <div
          className="rcta"
          style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '48px' }}
        >
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(30px,3.2vw,44px)', fontWeight: 300, color: 'var(--linen)', marginBottom: '10px' }}>
              {classesPage.ctaHeading}{' '}
              {classesPage.ctaHeadingItalic && <em style={{ fontStyle: 'italic', color: '#c4a882' }}>{classesPage.ctaHeadingItalic}</em>}
            </h3>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 300, color: 'rgba(244,237,225,.5)', lineHeight: 1.7 }}>{classesPage.ctaBody}</p>
          </div>
          <div style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
            <Link href="/memberships" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', fontWeight: 400, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--linen)', border: '1px solid rgba(255,255,255,.22)', padding: '13px 28px', textDecoration: 'none', display: 'inline-block' }}>
              View memberships
            </Link>
            <Link href="/free-trial" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--esp)', background: 'var(--linen)', padding: '13px 28px', textDecoration: 'none', display: 'inline-block' }}>
              Book free trial
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
