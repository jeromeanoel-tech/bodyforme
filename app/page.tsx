'use client'

import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { home, studio, classTypes, memberships } from '@/lib/content'
import ScrollReveal from '@/components/ScrollReveal'

export default function HomePage() {
  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── HERO ── */}
      <section style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 48px', minHeight: '88vh', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

          {/* Left: copy */}
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '28px', height: '1px', background: 'var(--rule)', display: 'block' }} />
              {home.hero.eyebrow}
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(52px,6vw,84px)', fontWeight: 400, lineHeight: 1.04, color: 'var(--esp)', letterSpacing: '-.01em', marginBottom: '28px' }}>
              {home.hero.heading}<br />
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>{home.hero.headingItalic}</em>
            </h1>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.8, maxWidth: '420px', marginBottom: '40px' }}>
              {home.hero.body}
            </p>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/free-trial"
                style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--esp)', padding: '14px 32px', textDecoration: 'none', transition: 'background .2s', display: 'inline-block' }}
              >
                {home.hero.cta1}
              </Link>
              <Link
                href="/classes"
                style={{ fontSize: '10.5px', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--mid)', borderBottom: '1px solid var(--rule)', paddingBottom: '2px', textDecoration: 'none', transition: 'all .2s' }}
              >
                {home.hero.cta2}
              </Link>
            </div>
          </div>

          {/* Right: image placeholder + stats */}
          <div style={{ position: 'relative' }}>
            {/* Main image placeholder */}
            <div style={{ height: '520px', background: 'linear-gradient(150deg,#d4c4ae 0%,#7a5838 100%)', position: 'relative' }}>
              {/* Floating stat card */}
              <div style={{ position: 'absolute', bottom: '-24px', left: '-32px', background: 'var(--canvas)', border: '1px solid var(--rule)', padding: '20px 28px', minWidth: '180px' }}>
                <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '36px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1 }}>{home.hero.stat1.value}</div>
                <div style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '6px' }}>{home.hero.stat1.label}</div>
              </div>
              {/* Floating quote card */}
              <div style={{ position: 'absolute', top: '32px', right: '-24px', background: 'var(--esp)', padding: '20px 24px', maxWidth: '220px' }}>
                <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '16px', fontStyle: 'italic', fontWeight: 300, color: 'rgba(244,237,225,.8)', lineHeight: 1.5 }}>
                  &ldquo;{home.hero.quote}&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)', overflow: 'hidden', padding: '14px 0' }}>
        <div className="ticker-track">
          {[...home.ticker, ...home.ticker].map((item, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '32px', paddingRight: '32px', fontSize: '11px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--mid)', fontWeight: 400 }}>
              {item}
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--blt)', display: 'inline-block', flexShrink: 0 }} />
            </span>
          ))}
        </div>
      </div>

      {/* ── CLASSES PREVIEW ── */}
      <section style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '52px' }}>
              <div>
                <div className="slbl">{home.classesSection.eyebrow}</div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', margin: 0 }}>
                  {home.classesSection.heading}{' '}
                  <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>{home.classesSection.headingItalic}</em>
                </h2>
              </div>
              <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75, maxWidth: '300px', textAlign: 'right' }}>
                {home.classesSection.intro}
              </p>
            </div>
          </ScrollReveal>

          {/* 4-col hover-fill cards */}
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {classTypes.map((cls, i) => (
                <ClassCard key={cls.slug} cls={cls} index={i} />
              ))}
            </div>
          </ScrollReveal>

          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <Link
              href="/classes"
              style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--esp)', border: '1px solid var(--esp)', padding: '13px 32px', textDecoration: 'none', display: 'inline-block', transition: 'all .2s' }}
            >
              View full schedule
            </Link>
          </div>
        </div>
      </section>

      {/* ── BENEFITS (dark) ── */}
      <section style={{ background: 'var(--esp)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <ScrollReveal>
            <div className="slbl" style={{ color: 'rgba(244,237,225,.3)' }}><span>{home.benefitsSection.eyebrow}</span></div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--linen)', marginBottom: '24px' }}>
              {home.benefitsSection.heading}{' '}
              <em style={{ fontStyle: 'italic', color: '#c4a882' }}>{home.benefitsSection.headingItalic}</em>
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.6)', lineHeight: 1.8, marginBottom: '16px' }}>{home.benefitsSection.body1}</p>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.6)', lineHeight: 1.8, marginBottom: '36px' }}>{home.benefitsSection.body2}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {home.benefitsSection.benefits.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', fontWeight: 300, color: 'rgba(244,237,225,.7)' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#c4a882', flexShrink: 0 }} />
                  {b}
                </li>
              ))}
            </ul>
          </ScrollReveal>
          {/* Image placeholder */}
          <ScrollReveal>
            <div style={{ height: '560px', background: 'linear-gradient(150deg,rgba(196,168,130,.2) 0%,rgba(122,74,42,.3) 100%)', border: '1px solid rgba(255,255,255,.08)' }} />
          </ScrollReveal>
        </div>
      </section>

      {/* ── PHILOSOPHY ── */}
      <section style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
          <ScrollReveal>
            <div className="slbl">{home.philosophySection.eyebrow}</div>
            <blockquote style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(24px,2.8vw,36px)', fontStyle: 'italic', fontWeight: 300, color: 'var(--esp)', lineHeight: 1.3, borderTop: '2px solid var(--esp)', paddingTop: '24px', marginBottom: '28px' }}>
              {home.philosophySection.pullQuote}
            </blockquote>
            <p style={{ fontSize: '10px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '20px', height: '1px', background: 'var(--blt)', display: 'block' }} />
              {home.philosophySection.quoteAttr}
            </p>
            <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.8, marginTop: '32px' }}>
              {home.philosophySection.body}
            </p>
          </ScrollReveal>
          {/* Stats */}
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)', marginTop: '56px' }}>
              {home.philosophySection.stats.map((s, i) => (
                <div key={i} style={{ padding: '44px 36px', background: 'var(--linen)' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '48px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1, marginBottom: '12px' }}>{s.value}</div>
                  <div style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── MEMBERSHIPS ── */}
      <section style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '52px' }}>
              <div>
                <div className="slbl">Membership plans</div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', margin: 0 }}>
                  Find your <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>fit</em>
                </h2>
              </div>
              <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75, maxWidth: '300px', textAlign: 'right' }}>
                All memberships include access to every class type. No lock-in, no joining fee.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {memberships.plans.map(plan => (
                <MembershipCard key={plan.name} plan={plan} />
              ))}
            </div>
          </ScrollReveal>
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <Link
              href="/memberships"
              style={{ fontSize: '10.5px', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brown)', borderBottom: '1px solid var(--brown)', paddingBottom: '2px', textDecoration: 'none' }}
            >
              Compare all plans →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTACT STRIP ── */}
      <section style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
          <ScrollReveal>
            <div className="slbl">{home.contactSection.eyebrow}</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', marginBottom: '24px' }}>
              {home.contactSection.heading}{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>{home.contactSection.headingItalic}</em>
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.8, marginBottom: '32px' }}>{home.contactSection.body}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {[
                { label: 'Address', value: '132 Ayr Street, Doncaster VIC 3108' },
                { label: 'Hours',   value: 'Mon–Fri 6am–8pm · Sat 7am–2pm · Sun 8am–12pm' },
                { label: 'Email',   value: 'hello@bodyforme.com.au' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '16px 0', borderTop: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }}>
                  <span style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: '2px' }}>{label}</span>
                  <span style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--text)' }}>{value}</span>
                </div>
              ))}
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <ContactForm compact />
          </ScrollReveal>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ClassCard({ cls, index }: { cls: typeof classTypes[0]; index: number }) {
  return (
    <div
      className="group"
      style={{ background: 'var(--linen)', padding: '32px 28px', cursor: 'pointer', transition: 'background .2s', position: 'relative' }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.background = 'var(--esp)'
        el.querySelectorAll<HTMLElement>('[data-invert]').forEach(c => { c.style.color = 'rgba(244,237,225,.75)' })
        el.querySelectorAll<HTMLElement>('[data-invert-strong]').forEach(c => { c.style.color = 'rgba(244,237,225,1)' })
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.background = 'var(--linen)'
        el.querySelectorAll<HTMLElement>('[data-invert]').forEach(c => { c.style.color = '' })
        el.querySelectorAll<HTMLElement>('[data-invert-strong]').forEach(c => { c.style.color = '' })
      }}
    >
      <div data-invert style={{ fontSize: '11px', fontFamily: 'var(--font-cormorant)', color: 'var(--muted)', marginBottom: '20px', transition: 'color .2s' }}>
        0{index + 1}
      </div>
      <h3 data-invert-strong style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.1, marginBottom: '12px', transition: 'color .2s' }}>
        {cls.name}{' '}
        {cls.nameItalic && <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>{cls.nameItalic}</em>}
      </h3>
      <p data-invert style={{ fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7, marginBottom: '20px', transition: 'color .2s' }}>
        {cls.desc}
      </p>
      <div data-invert style={{ fontSize: '9.5px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', gap: '16px', transition: 'color .2s' }}>
        <span>{cls.duration}</span>
        <span>·</span>
        <span>{cls.level}</span>
      </div>
    </div>
  )
}

function MembershipCard({ plan }: { plan: typeof memberships.plans[0] }) {
  const featured = plan.featured
  return (
    <div style={{ background: featured ? 'var(--esp)' : 'var(--linen)', padding: '40px 36px 44px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {plan.badge && (
        <span style={{ position: 'absolute', top: 0, right: '36px', background: 'var(--blt)', color: 'var(--canvas)', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', padding: '5px 12px', fontWeight: 500 }}>
          {plan.badge}
        </span>
      )}
      <span style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: featured ? 'rgba(244,237,225,.5)' : 'var(--muted)', padding: '4px 10px', display: 'inline-block', marginBottom: '28px', border: `1px solid ${featured ? 'rgba(255,255,255,.12)' : 'var(--rule)'}` }}>
        {plan.tag}
      </span>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '32px', fontWeight: 400, color: featured ? 'var(--linen)' : 'var(--esp)', lineHeight: 1.05, marginBottom: '6px' }}>{plan.name}</div>
      <p style={{ fontSize: '12.5px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.55)' : 'var(--mid)', marginBottom: '28px', lineHeight: 1.5 }}>{plan.tagline}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '56px', fontWeight: 300, lineHeight: 1, color: featured ? 'var(--linen)' : 'var(--esp)' }}>{plan.amount}</span>
        <span style={{ fontSize: '12px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.45)' : 'var(--muted)' }}>{plan.period}</span>
      </div>
      <p style={{ fontSize: '11.5px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.4)' : 'var(--muted)', marginBottom: '32px' }}>{plan.equiv}</p>
      <div style={{ height: '1px', background: featured ? 'rgba(255,255,255,.1)' : 'var(--rule)', marginBottom: '28px' }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '13px', flex: 1 }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ fontSize: '12.5px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.65)' : 'var(--mid)', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.5 }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: featured ? 'rgba(196,168,130,.6)' : 'var(--blt)', flexShrink: 0, marginTop: '7px' }} />
            {f}
          </li>
        ))}
        {plan.crossedOut.map((f, i) => (
          <li key={`x${i}`} style={{ fontSize: '12.5px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.2)' : 'var(--mid)', opacity: .4, textDecoration: 'line-through', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.5 }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--rule)', flexShrink: 0, marginTop: '7px' }} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/memberships"
        style={{ display: 'block', textAlign: 'center', fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', padding: '14px', border: `1px solid ${featured ? 'rgba(255,255,255,.25)' : 'var(--esp)'}`, color: featured ? 'var(--linen)' : 'var(--esp)', textDecoration: 'none', transition: 'all .2s' }}
      >
        {plan.cta}
      </Link>
    </div>
  )
}

// Minimal inline contact form for homepage
function ContactForm({ compact }: { compact?: boolean }) {
  return (
    <div style={{ paddingTop: compact ? '0' : '60px' }}>
      <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 400, color: 'var(--esp)', marginBottom: '28px' }}>
        {home.contactSection.formHeading}
      </h3>
      <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', marginBottom: '28px', lineHeight: 1.7 }}>
        We aim to respond within one business day.
      </p>
      <form action="/api/contact" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Name</label>
            <input name="name" type="text" required style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', padding: '8px 0', fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--text)', outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Email</label>
            <input name="email" type="email" required style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', padding: '8px 0', fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--text)', outline: 'none' }} />
          </div>
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '9.5px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '8px' }}>Message</label>
          <textarea name="message" required rows={4} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', padding: '8px 0', fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--text)', outline: 'none', resize: 'none' }} />
        </div>
        <button
          type="submit"
          style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--esp)', padding: '15px 36px', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-dm-sans)', transition: 'background .2s', alignSelf: 'flex-start' }}
        >
          Send message
        </button>
      </form>
    </div>
  )
}
