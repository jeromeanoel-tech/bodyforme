import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import Link from 'next/link'
import { about, studio, memberships } from '@/lib/content'

export const metadata = {
  title:       'About Us | BodyForme Pilates',
  description: 'Meet Suzanne Harb and the BodyForme team. Our story, values and what makes our Doncaster Pilates studio different.',
}

/* ── Photo placeholder ────────────────────────────────────────────────────── */
function Photo({ label = 'Studio photo', style = {}, className = '' }: { label?: string; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={`photo-block ${className}`}
      data-label={label}
      style={{ background: 'var(--l3)', position: 'relative', overflow: 'hidden', ...style }}
    />
  )
}

export default function AboutPage() {
  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── PAGE HERO ── */}
      <div
        className="pg-hero-grid"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--rule)', minHeight: '78vh' }}
      >
        {/* Left dark */}
        <div style={{ background: 'var(--esp)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '72px 56px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 60%,oklch(0.35 0.06 40 / .5) 0%,transparent 65%)' }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9.5px', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(244,237,225,.35)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '28px', height: '1px', background: 'rgba(196,168,130,.4)', display: 'block' }} />
              {about.hero.eyebrow}
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(52px,5.5vw,82px)', fontWeight: 400, lineHeight: 1.03, color: 'var(--linen)', letterSpacing: '-.02em', marginBottom: '28px' }}>
              {about.hero.heading}<br />
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#c4a882' }}>{about.hero.headingItalic}</em>
            </h1>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.55)', lineHeight: 1.85, maxWidth: '380px' }}>
              {about.hero.body}
            </p>
          </div>
        </div>

        {/* Right: quote + stats + photo */}
        <div className="pg-hero-right" style={{ background: 'var(--l2)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '72px 56px', gap: '40px' }}>
          <blockquote style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(24px,2.8vw,36px)', fontStyle: 'italic', fontWeight: 300, color: 'var(--esp)', lineHeight: 1.3, borderTop: '2px solid var(--esp)', paddingTop: '28px', margin: 0 }}>
            {about.hero.quote}
          </blockquote>
          <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9.5px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <span style={{ width: '20px', height: '1px', background: 'var(--blt)', display: 'block' }} />
            {about.hero.quoteAttr}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: '1px solid var(--rule)' }}>
            {about.hero.stats.map((s, i) => (
              <div key={i} style={{ padding: '22px 24px', borderRight: i < 2 ? '1px solid var(--rule)' : 'none', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '40px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1, display: 'block' }}>{s.value}</span>
                <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '6px', display: 'block' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOUNDER STORY ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <ScrollReveal>
          <div className="r2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '640px' }}>
            {/* Suzanne photo */}
            <div style={{ position: 'relative', overflow: 'hidden', minHeight: '580px' }}>
              <img
                src="/suzanne.jpeg"
                alt="Suzanne Harb"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(42,21,6,.55) 0%,transparent 50%)' }} />
              <div style={{ position: 'absolute', bottom: '40px', left: '44px', zIndex: 2 }}>
                <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 400, color: 'var(--linen)', lineHeight: 1 }}>{about.founder.name}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(244,237,225,.5)', marginTop: '5px' }}>{about.founder.role}</div>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '80px 72px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--rule)' }}>
              <div className="slbl" style={{ marginBottom: '24px' }}>{about.founder.eyebrow}</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,50px)', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.08, marginBottom: '28px' }}>
                {about.founder.heading}{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 300 }}>{about.founder.headingItalic}</em>
              </h2>
              {about.founder.paragraphs.map((p, i) => (
                <p key={i} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, marginBottom: '16px' }}>{p}</p>
              ))}
              <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '26px', fontWeight: 300, color: 'var(--esp)', marginTop: '32px', paddingTop: '28px', borderTop: '1px solid var(--rule)' }}>
                {about.founder.signature}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ── PHOTO GALLERY (placeholder grid) ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <ScrollReveal>
          <div className="gallery-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: 'auto auto', gap: '2px', background: 'var(--rule)' }}>
            {/* Large hero photo */}
            <Photo
              label="Studio space"
              style={{ gridRow: '1 / 3', minHeight: '520px' }}
            />
            <Photo label="Class in session" style={{ minHeight: '258px' }} />
            <Photo label="Reception / entrance" style={{ minHeight: '258px' }} />
            <Photo label="Equipment" style={{ minHeight: '258px' }} />
            <Photo label="Detail / texture" style={{ minHeight: '258px' }} />
          </div>
        </ScrollReveal>
      </div>

      {/* ── VALUES (dark) ── */}
      <div style={{ background: 'var(--esp)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div className="slbl" style={{ color: 'rgba(244,237,225,.28)' }}><span>What we believe</span></div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--linen)', marginBottom: '8px' }}>
              The <em style={{ fontStyle: 'italic', color: '#c4a882' }}>values</em> we practise
            </h2>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.5)', lineHeight: 1.85, maxWidth: '480px', margin: '20px 0 72px' }}>
              These aren&apos;t words on a wall. They shape how we teach, how we welcome, and how we build this community every day.
            </p>
            <div className="r3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid rgba(255,255,255,.07)' }}>
              {about.values.map((v, i) => (
                <div key={i} style={{ padding: '48px 28px 48px 0', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '11px', color: 'rgba(244,237,225,.18)', letterSpacing: '.1em', marginBottom: '20px' }}>{v.n}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 400, color: 'var(--linen)', lineHeight: 1.2, marginBottom: '14px' }}>
                    {v.title} <em style={{ fontStyle: 'italic', color: '#c4a882' }}>{v.titleItalic}</em>
                  </div>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 300, color: 'rgba(244,237,225,.48)', lineHeight: 1.8 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── INSTRUCTORS ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div className="slbl">The team</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)' }}>
              Meet the <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>instructors</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div className="r3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)', marginTop: '56px' }}>
              {about.instructors.map((inst, i) => (
                <div key={i} style={{ background: 'var(--canvas)' }}>
                  {/* Photo placeholder */}
                  <Photo
                    label={`${inst.name} — instructor photo`}
                    style={{ aspectRatio: '4/3', width: '100%' }}
                  />
                  <div style={{ padding: '28px 28px 36px' }}>
                    <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.1, marginBottom: '4px' }}>{inst.name}</div>
                    <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '14px' }}>{inst.role}</div>
                    <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75 }}>{inst.bio}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '16px' }}>
                      {inst.tags.map(tag => (
                        <span key={tag} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '8.5px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', border: '1px solid var(--rule)', padding: '3px 8px' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── TIMELINE ── */}
      <div style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)' }}>
        <div className="r2 sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '88px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '88px', alignItems: 'start' }}>
          <ScrollReveal>
            <div>
              <div className="slbl">Our journey</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', marginBottom: '24px' }}>
                How it all <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>began</em>
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, maxWidth: '360px' }}>
                From a single studio in Doncaster to a growing community — here are the milestones that have shaped BodyForme.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div>
              {about.timeline.map((item, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '72px 1fr',
                    gap: '24px',
                    padding: '24px 0',
                    borderTop: '1px solid var(--rule)',
                    ...(i === about.timeline.length - 1 ? { borderBottom: '1px solid var(--rule)' } : {}),
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1, paddingTop: '3px' }}>{item.year}</div>
                  <div>
                    <strong style={{ fontFamily: 'var(--font-dm-sans)', display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{item.title}</strong>
                    <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7 }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── MEMBER STORIES ── */}
      <div id="stories" style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div style={{ marginBottom: '60px' }}>
              <div className="slbl">Member stories</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', margin: '0 0 16px' }}>
                In their own <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>words</em>
              </h2>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, maxWidth: '480px', margin: 0 }}>
                Real experiences from members who found something they weren&apos;t expecting.
              </p>
            </div>
          </ScrollReveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {memberships.testimonials.map((t, i) => (
              <ScrollReveal key={i}>
                <div
                  className="r2 sp"
                  style={{
                    background: i % 2 === 0 ? 'var(--linen)' : 'var(--canvas)',
                    padding: '44px 56px',
                    display: 'grid',
                    gridTemplateColumns: '1fr 2fr',
                    gap: '64px',
                    alignItems: 'start',
                  }}
                >
                  <div style={{ paddingTop: '4px' }}>
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '20px' }}>
                      {Array.from({ length: t.stars }).map((_, si) => (
                        <svg key={si} width="12" height="12" viewBox="0 0 14 14" fill="var(--brown)"><path d="M7 1l1.5 4.2H13L9.3 7.8l1.4 4.2L7 9.5l-3.7 2.5 1.4-4.2L1 5.2h4.5z"/></svg>
                      ))}
                    </div>
                    <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--esp)', margin: '0 0 5px' }}>{t.name}</p>
                    <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', fontWeight: 300, color: 'var(--muted)', margin: 0, letterSpacing: '.04em' }}>{t.detail}</p>
                  </div>
                  <div>
                    {t.fullReview.split('\n\n').map((para, pi) => (
                      <p key={pi} style={{ fontFamily: pi === 0 ? 'var(--font-cormorant)' : 'var(--font-dm-sans)', fontSize: pi === 0 ? '20px' : '13.5px', fontStyle: pi === 0 ? 'italic' : 'normal', fontWeight: 300, color: pi === 0 ? 'var(--esp)' : 'var(--mid)', lineHeight: pi === 0 ? 1.5 : 1.85, margin: pi === 0 ? '0 0 16px' : '0' }}>
                        {pi === 0 ? `"${para}"` : para}
                      </p>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="sp" style={{ background: 'var(--esp)', padding: '72px 48px' }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '48px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(30px,3.2vw,46px)', fontWeight: 300, color: 'var(--linen)', marginBottom: '10px' }}>
              {about.cta.heading}{' '}
              <em style={{ fontStyle: 'italic', color: '#c4a882' }}>{about.cta.headingItalic}</em>
            </h3>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 300, color: 'rgba(244,237,225,.45)', lineHeight: 1.7 }}>{about.cta.body}</p>
          </div>
          <div className="rcta" style={{ display: 'flex', gap: '14px', flexShrink: 0 }}>
            <Link href="/classes" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', fontWeight: 400, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--linen)', border: '1px solid rgba(255,255,255,.22)', padding: '13px 28px', textDecoration: 'none', display: 'inline-block', transition: 'border-color .2s' }}>
              View classes
            </Link>
            <Link href="/free-trial" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--esp)', background: 'var(--linen)', padding: '13px 28px', textDecoration: 'none', display: 'inline-block', transition: 'background .2s' }}>
              Book free trial
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
