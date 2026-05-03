import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import Link from 'next/link'
import { about, studio } from '@/lib/content'

export const metadata = {
  title: 'About Us | BodyForme Pilates',
  description: 'Meet Suzanne Harb and the BodyForme team. Our story, values and what makes our Doncaster Pilates studio different.',
}

const GRAD_COLORS = [
  'linear-gradient(150deg,#c8b89a 0%,#7a5a3e 100%)',
  'linear-gradient(150deg,#b8c8b8 0%,#4a6850 100%)',
  'linear-gradient(150deg,#c0b8d0 0%,#685878 100%)',
  'linear-gradient(150deg,#d0c0a8 0%,#8a6848 100%)',
]

const GALLERY_GRADS = [
  'linear-gradient(135deg,#d4c4ae 0%,#7a5838 100%)',
  'linear-gradient(135deg,#b0b8a8 0%,#4a6050 100%)',
  'linear-gradient(135deg,#c8b0a0 0%,#8a5040 100%)',
  'linear-gradient(135deg,#b8c0d0 0%,#486080 100%)',
  'linear-gradient(135deg,#c4b8a8 0%,#7a6858 100%)',
]

export default function AboutPage() {
  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── PAGE HERO ── */}
      <div style={{ minHeight: '72vh', display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--rule)' }}>
        {/* Left dark */}
        <div style={{ background: 'var(--esp)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '64px 56px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%,oklch(0.38 0.06 40 / .45) 0%,transparent 65%)' }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,.4)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '28px', height: '1px', background: 'rgba(196,168,130,.5)', display: 'block' }} />
              {about.hero.eyebrow}
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(52px,5.5vw,80px)', fontWeight: 400, lineHeight: 1.04, color: 'var(--linen)', letterSpacing: '-.01em', marginBottom: '28px' }}>
              {about.hero.heading}<br />
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#c4a882' }}>{about.hero.headingItalic}</em>
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.6)', lineHeight: 1.8, maxWidth: '380px' }}>
              {about.hero.body}
            </p>
          </div>
        </div>
        {/* Right linen */}
        <div style={{ background: 'var(--l2)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '64px 56px', gap: '36px' }}>
          <blockquote style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(24px,2.8vw,36px)', fontStyle: 'italic', fontWeight: 300, color: 'var(--esp)', lineHeight: 1.3, borderTop: '2px solid var(--esp)', paddingTop: '24px' }}>
            {about.hero.quote}
          </blockquote>
          <p style={{ fontSize: '10px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '20px', height: '1px', background: 'var(--blt)', display: 'block' }} />
            {about.hero.quoteAttr}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0, border: '1px solid var(--rule)' }}>
            {about.hero.stats.map((s, i) => (
              <div key={i} style={{ padding: '20px 24px', borderRight: i < 2 ? '1px solid var(--rule)' : 'none', textAlign: 'center' }}>
                <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '38px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1, display: 'block' }}>{s.value}</span>
                <span style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FOUNDER STORY ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <ScrollReveal>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: '600px' }}>
            {/* Image */}
            <div style={{ background: 'linear-gradient(150deg,#c8b090 0%,#6a3c18 100%)', position: 'relative', overflow: 'hidden', minHeight: '560px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(42,21,6,.4) 0%,transparent 55%)' }} />
              <div style={{ position: 'absolute', bottom: '36px', left: '40px', zIndex: 2 }}>
                <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--linen)', lineHeight: 1 }}>{about.founder.name}</div>
                <div style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(244,237,225,.55)', marginTop: '4px' }}>{about.founder.role}</div>
              </div>
            </div>
            {/* Content */}
            <div style={{ padding: '80px 72px', display: 'flex', flexDirection: 'column', justifyContent: 'center', borderLeft: '1px solid var(--rule)' }}>
              <div className="slbl" style={{ marginBottom: '24px' }}>{about.founder.eyebrow}</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '46px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.1, marginBottom: '28px' }}>
                {about.founder.heading}{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 300 }}>{about.founder.headingItalic}</em>
              </h2>
              {about.founder.paragraphs.map((p, i) => (
                <p key={i} style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.8, marginBottom: '16px' }}>{p}</p>
              ))}
              <div style={{ fontFamily: 'var(--font-cormorant)', fontStyle: 'italic', fontSize: '26px', fontWeight: 300, color: 'var(--esp)', marginTop: '32px', paddingTop: '28px', borderTop: '1px solid var(--rule)' }}>
                {about.founder.signature}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>

      {/* ── VALUES (dark) ── */}
      <div style={{ background: 'var(--esp)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 48px' }}>
          <ScrollReveal>
            <div className="slbl" style={{ color: 'rgba(244,237,225,.3)' }}><span>What we believe</span></div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--linen)', marginBottom: '8px' }}>
              The <em style={{ fontStyle: 'italic', color: '#c4a882' }}>values</em> we practise
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.55)', lineHeight: 1.75, maxWidth: '480px', margin: '20px 0 64px' }}>
              These aren&apos;t words on a wall. They shape how we teach, how we welcome, and how we build this community every day.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderTop: '1px solid rgba(255,255,255,.08)' }}>
              {about.values.map((v, i) => (
                <div key={i} style={{ padding: '44px 48px 44px 0', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '11px', color: 'rgba(244,237,225,.2)', letterSpacing: '.1em', marginBottom: '20px' }}>{v.n}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '26px', fontWeight: 400, color: 'var(--linen)', lineHeight: 1.2, marginBottom: '12px' }}>
                    {v.title} <em style={{ fontStyle: 'italic', color: '#c4a882' }}>{v.titleItalic}</em>
                  </div>
                  <p style={{ fontSize: '12.5px', fontWeight: 300, color: 'rgba(244,237,225,.5)', lineHeight: 1.75 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── INSTRUCTORS ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div className="slbl">The team</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)' }}>
              Meet the <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>instructors</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)', marginTop: '52px' }}>
              {about.instructors.map((inst, i) => (
                <div key={i} style={{ background: 'var(--linen)', cursor: 'pointer', transition: 'background .2s' }}>
                  <div style={{ height: '280px', background: GRAD_COLORS[i % GRAD_COLORS.length], position: 'relative', overflow: 'hidden' }} />
                  <div style={{ padding: '22px 24px 28px' }}>
                    <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.1, marginBottom: '4px' }}>{inst.name}</div>
                    <div style={{ fontSize: '9.5px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '12px' }}>{inst.role}</div>
                    <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.65 }}>{inst.bio}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                      {inst.tags.map(tag => (
                        <span key={tag} style={{ fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)', border: '1px solid var(--rule)', padding: '3px 8px' }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── GALLERY ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px 52px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <ScrollReveal>
            <div>
              <div className="slbl">The space</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)' }}>
                Inside the <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>studio</em>
              </h2>
            </div>
          </ScrollReveal>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75, maxWidth: '340px', textAlign: 'right' }}>
            Designed for practice. Timber floors, natural light and an atmosphere that makes you want to come back tomorrow.
          </p>
        </div>
        <ScrollReveal>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 48px 88px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '280px 280px', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
            {about.gallery.map((cell, i) => (
              <div key={i} style={{ overflow: 'hidden', position: 'relative', cursor: 'pointer', gridRow: i === 0 ? 'span 2' : undefined }}>
                <div style={{ width: '100%', height: '100%', background: GALLERY_GRADS[i], transition: 'transform .5s ease' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(42,21,6,.3)', display: 'flex', alignItems: 'flex-end', padding: '20px' }}>
                  <span style={{ fontSize: '10px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(244,237,225,.8)' }}>{cell.label}</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>

      {/* ── TIMELINE ── */}
      <div style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
          <ScrollReveal>
            <div>
              <div className="slbl">Our journey</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', marginBottom: '24px' }}>
                How it all <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>began</em>
              </h2>
              <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75, maxWidth: '360px' }}>
                From a single studio in Doncaster to a growing community — here are the milestones that have shaped BodyForme.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div>
              {about.timeline.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '24px', padding: '24px 0', borderTop: '1px solid var(--rule)', ...(i === about.timeline.length - 1 ? { borderBottom: '1px solid var(--rule)' } : {}) }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1, paddingTop: '2px' }}>{item.year}</div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: 'var(--text)', marginBottom: '4px' }}>{item.title}</strong>
                    <span style={{ fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.6 }}>{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ background: 'var(--esp)', padding: '64px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '48px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(28px,3vw,42px)', fontWeight: 300, color: 'var(--linen)', marginBottom: '8px' }}>
              {about.cta.heading}{' '}
              <em style={{ fontStyle: 'italic', color: '#c4a882' }}>{about.cta.headingItalic}</em>
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(244,237,225,.5)', lineHeight: 1.6 }}>{about.cta.body}</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            <Link
              href="/classes"
              style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--linen)', border: '1px solid rgba(255,255,255,.25)', padding: '13px 28px', textDecoration: 'none', display: 'inline-block', transition: 'border-color .2s' }}
            >
              View classes
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
