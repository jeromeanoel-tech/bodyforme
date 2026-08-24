'use client'

import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ClassAccordion from '@/components/ClassAccordion'
import ScrollReveal from '@/components/ScrollReveal'
import { useState, useRef, useEffect } from 'react'
import { home, studio, classTypes, memberships } from '@/lib/content'

type ClassType = { slug: string; name: string; nameItalic?: string; tags?: string[]; desc: string; priceNote?: string }

/* ── Photo placeholder ─────────────────────────────────────────────────────── */
function Photo({
  label = 'Studio photo',
  style = {},
  className = '',
}: {
  label?: string
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <div
      className={`photo-block ${className}`}
      data-label={label}
      style={{ background: 'var(--l3)', position: 'relative', overflow: 'hidden', ...style }}
    />
  )
}

/* ── Homepage ──────────────────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <div className="site-body">
      <SiteHeader />

      <HeroSection />
      <Ticker />
      <ClassesSection />
      <BenefitsSection />
      <PhilosophySection />
      <MembershipsSection />
      <TestimonialsSection />
      <ContactSection />

      <SiteFooter />
    </div>
  )
}

/* ── Hero ──────────────────────────────────────────────────────────────────── */
function HeroSection() {
  return (
    <section style={{ borderBottom: '1px solid var(--rule)', overflow: 'hidden' }}>
      <div
        className="hero-grid"
        style={{
          maxWidth: '1320px',
          margin: '0 auto',
          padding: '0 48px',
          minHeight: '90vh',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '72px',
          alignItems: 'center',
        }}
      >
        {/* ── Left: copy ── */}
        <div style={{ paddingTop: '24px', paddingBottom: '24px' }}>

          {/* Eyebrow */}
          <div
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '9.5px',
              letterSpacing: '.22em',
              textTransform: 'uppercase',
              color: 'var(--muted)',
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'fade-in .6s ease .1s both',
            }}
          >
            <span style={{ width: '28px', height: '1px', background: 'var(--rule)', display: 'block' }} />
            {home.hero.eyebrow}
          </div>

          {/* Headline — word-split animation */}
          <h1
            style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: 'clamp(58px, 6.5vw, 96px)',
              fontWeight: 400,
              lineHeight: 1.02,
              color: 'var(--esp)',
              letterSpacing: '-.02em',
              marginBottom: '32px',
            }}
          >
            {home.hero.heading.split(' ').map((word, i) => (
              <span
                key={i}
                className="hero-word"
                style={{
                  animationDelay: `${i * 90 + 150}ms`,
                  marginRight: word === home.hero.heading.split(' ').at(-1) ? '0' : '.28em',
                }}
              >
                {word}
              </span>
            ))}
            <br />
            <em
              className="hero-word"
              style={{
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'var(--brown)',
                animationDelay: `${home.hero.heading.split(' ').length * 90 + 150}ms`,
              }}
            >
              {home.hero.headingItalic}
            </em>
          </h1>

          {/* Body */}
          <p
            style={{
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '14.5px',
              fontWeight: 300,
              color: 'var(--mid)',
              lineHeight: 1.85,
              maxWidth: '400px',
              marginBottom: '44px',
              animation: 'slide-up .6s ease .55s both',
            }}
          >
            {home.hero.body}
          </p>

          {/* CTAs */}
          <div
            className="hero-ctas"
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              animation: 'slide-up .6s ease .7s both',
            }}
          >
            <Link href="/free-trial" className="btn-primary">
              {home.hero.cta1}
            </Link>
            <Link href="/classes" className="btn-ghost">
              {home.hero.cta2}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 8h10M9 4l4 4-4 4" />
              </svg>
            </Link>
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: 'flex',
              gap: '0',
              marginTop: '56px',
              borderTop: '1px solid var(--rule)',
              paddingTop: '32px',
              animation: 'slide-up .6s ease .85s both',
            }}
          >
            {[home.hero.stat1, { value: '12', label: 'Classes per week' }, { value: '8+', label: 'Years of practice' }].map((s, i) => (
              <div
                key={i}
                style={{
                  paddingRight: '36px',
                  marginRight: '36px',
                  borderRight: i < 2 ? '1px solid var(--rule)' : 'none',
                }}
              >
                <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '38px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: '6px' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: photo placeholder ── */}
        <div className="hero-right" style={{ position: 'relative', height: '82vh', maxHeight: '680px' }}>
          <Photo
            label="Studio hero photo"
            style={{ width: '100%', height: '100%' }}
          />
          {/* Floating quote card */}
          <div
            style={{
              position: 'absolute',
              bottom: '-24px',
              left: '-32px',
              background: 'var(--esp)',
              padding: '24px 28px',
              maxWidth: '230px',
              zIndex: 2,
              animation: 'slide-up .6s ease 1s both',
            }}
          >
            <p style={{ fontFamily: 'var(--font-cormorant)', fontSize: '16px', fontStyle: 'italic', fontWeight: 300, color: 'rgba(244,237,225,.8)', lineHeight: 1.55, margin: 0 }}>
              &ldquo;{home.hero.quote}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Ticker ────────────────────────────────────────────────────────────────── */
function Ticker() {
  return (
    <div style={{ background: 'var(--esp)', borderBottom: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', padding: '16px 0' }}>
      <div className="ticker-track">
        {[...home.ticker, ...home.ticker].map((item, i) => (
          <span
            key={i}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '32px',
              paddingRight: '32px',
              fontFamily: 'var(--font-dm-sans)',
              fontSize: '10px',
              letterSpacing: '.2em',
              textTransform: 'uppercase',
              color: 'rgba(244,237,225,.45)',
              fontWeight: 400,
            }}
          >
            {item}
            <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: 'var(--brown)', display: 'inline-block', flexShrink: 0 }} />
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Classes preview ───────────────────────────────────────────────────────── */
function ClassesSection() {
  return (
    <section style={{ borderBottom: '1px solid var(--rule)' }}>
      <div className="sp mob-vpad" style={{ maxWidth: '1320px', margin: '0 auto', padding: '104px 48px' }}>
        <ScrollReveal>
          <div className="rflex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px' }}>
            <div>
              <div className="slbl">{home.classesSection.eyebrow}</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', margin: 0 }}>
                {home.classesSection.heading}{' '}
                <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>{home.classesSection.headingItalic}</em>
              </h2>
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, maxWidth: '280px', textAlign: 'right' }}>
              {home.classesSection.intro}
            </p>
          </div>
        </ScrollReveal>

        {/* Desktop: 4-col hover cards */}
        <ScrollReveal>
          <div
            className="r4 desk-only"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}
          >
            {classTypes.map((cls, i) => (
              <ClassCard key={cls.slug} cls={cls} index={i} />
            ))}
          </div>
        </ScrollReveal>

        {/* Mobile: accordion */}
        <div className="mob-only">
          <ClassAccordion classes={classTypes as ClassType[]} bookingUrl={studio.bookingUrl} />
        </div>

        <div style={{ marginTop: '44px', textAlign: 'center' }}>
          <Link href="/classes" className="btn-outline">
            View full timetable
          </Link>
        </div>
      </div>
    </section>
  )
}

function ClassCard({ cls, index }: { cls: typeof classTypes[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <Link
      href="/classes"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'var(--esp)' : 'var(--canvas)',
          padding: '36px 30px 40px',
          cursor: 'pointer',
          transition: 'background .3s ease',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Number */}
        <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '11px', color: hovered ? 'rgba(244,237,225,.3)' : 'var(--muted)', marginBottom: '24px', transition: 'color .3s' }}>
          0{index + 1}
        </div>
        {/* Name */}
        <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 400, color: hovered ? 'rgba(244,237,225,1)' : 'var(--esp)', lineHeight: 1.1, marginBottom: '14px', transition: 'color .3s' }}>
          {cls.name}{' '}
          {cls.nameItalic && (
            <em style={{ fontStyle: 'italic', fontWeight: 300, color: hovered ? 'rgba(196,168,130,.9)' : 'var(--brown)', transition: 'color .3s' }}>
              {cls.nameItalic}
            </em>
          )}
        </h3>
        {/* Tags */}
        {'tags' in cls && Array.isArray(cls.tags) && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {(cls.tags as string[]).map(tag => (
              <span
                key={tag}
                style={{
                  fontFamily: 'var(--font-dm-sans)',
                  fontSize: '8.5px',
                  letterSpacing: '.14em',
                  textTransform: 'uppercase',
                  color: hovered ? 'rgba(196,168,130,.7)' : 'var(--blt)',
                  fontWeight: 500,
                  transition: 'color .3s',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {/* Description */}
        <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: hovered ? 'rgba(244,237,225,.6)' : 'var(--mid)', lineHeight: 1.75, flex: 1, transition: 'color .3s' }}>
          {cls.desc}
        </p>
        {/* Footer */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: `1px solid ${hovered ? 'rgba(255,255,255,.08)' : 'var(--rule)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color .3s' }}>
          <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: hovered ? 'rgba(244,237,225,.4)' : 'var(--muted)', transition: 'color .3s' }}>
            {'duration' in cls ? (cls as { duration?: string }).duration : ''} · {'level' in cls ? (cls as { level?: string }).level : ''}
          </span>
          <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', color: hovered ? 'rgba(196,168,130,.8)' : 'var(--brown)', transition: 'color .3s' }}>
            Book →
          </span>
        </div>
      </div>
    </Link>
  )
}

/* ── Benefits (dark) ───────────────────────────────────────────────────────── */
function BenefitsSection() {
  return (
    <section style={{ background: 'var(--esp)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
      <div
        className="r2 sp"
        style={{ maxWidth: '1320px', margin: '0 auto', padding: '104px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '88px', alignItems: 'center' }}
      >
        {/* Copy */}
        <ScrollReveal>
          <div>
            <div className="slbl" style={{ color: 'rgba(244,237,225,.28)' }}>
              <span>{home.benefitsSection.eyebrow}</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--linen)', marginBottom: '28px' }}>
              {home.benefitsSection.heading}{' '}
              <em style={{ fontStyle: 'italic', color: '#c4a882' }}>{home.benefitsSection.headingItalic}</em>
            </h2>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.55)', lineHeight: 1.85, marginBottom: '16px' }}>
              {home.benefitsSection.body1}
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.55)', lineHeight: 1.85, marginBottom: '40px' }}>
              {home.benefitsSection.body2}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {home.benefitsSection.benefits.map((b, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'rgba(244,237,225,.65)' }}>
                  <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#c4a882', flexShrink: 0 }} />
                  {b}
                </li>
              ))}
            </ul>
            <div style={{ marginTop: '44px' }}>
              <Link href="/about" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10px', fontWeight: 400, letterSpacing: '.16em', textTransform: 'uppercase', color: '#c4a882', borderBottom: '1px solid #c4a882', paddingBottom: '2px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                Our story
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
              </Link>
            </div>
          </div>
        </ScrollReveal>

        {/* Photo */}
        <ScrollReveal>
          <Photo
            label="Benefits / studio photo"
            style={{ aspectRatio: '3/4', width: '100%' }}
          />
        </ScrollReveal>
      </div>
    </section>
  )
}

/* ── Philosophy ────────────────────────────────────────────────────────────── */
function PhilosophySection() {
  return (
    <section style={{ borderBottom: '1px solid var(--rule)' }}>
      <div
        className="r2 sp"
        style={{ maxWidth: '1320px', margin: '0 auto', padding: '104px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '88px', alignItems: 'start' }}
      >
        {/* Quote + body */}
        <ScrollReveal>
          <div>
            <div className="slbl">{home.philosophySection.eyebrow}</div>
            <blockquote
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: 'clamp(26px,3vw,38px)',
                fontStyle: 'italic',
                fontWeight: 300,
                color: 'var(--esp)',
                lineHeight: 1.3,
                borderTop: '2px solid var(--esp)',
                paddingTop: '28px',
                marginBottom: '24px',
              }}
            >
              {home.philosophySection.pullQuote}
            </blockquote>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9.5px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <span style={{ width: '20px', height: '1px', background: 'var(--blt)', display: 'block' }} />
              {home.philosophySection.quoteAttr}
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85 }}>
              {home.philosophySection.body}
            </p>
          </div>
        </ScrollReveal>

        {/* Stats 2×2 */}
        <ScrollReveal>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1px',
              background: 'var(--rule)',
              border: '1px solid var(--rule)',
              marginTop: '56px',
            }}
          >
            {home.philosophySection.stats.map((s, i) => (
              <div key={i} style={{ padding: '48px 36px', background: 'var(--linen)' }}>
                <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '52px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1, marginBottom: '12px' }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

/* ── Memberships ───────────────────────────────────────────────────────────── */
function MembershipsSection() {
  return (
    <section style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)' }}>
      <div className="sp mob-vpad" style={{ maxWidth: '1320px', margin: '0 auto', padding: '104px 48px' }}>
        <ScrollReveal>
          <div className="rflex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px' }}>
            <div>
              <div className="slbl">Membership plans</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', margin: 0 }}>
                Find your <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>fit</em>
              </h2>
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, maxWidth: '280px', textAlign: 'right' }}>
              All memberships include access to every class type. No lock-in, no joining fee.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="r3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
            {memberships.plans.map(plan => (
              <MembershipCard key={plan.name} plan={plan} />
            ))}
          </div>
        </ScrollReveal>

        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <Link href="/memberships" className="btn-ghost">
            Compare all plans
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

function MembershipCard({ plan }: { plan: typeof memberships.plans[0] }) {
  const featured = plan.featured
  return (
    <div style={{ background: featured ? 'var(--esp)' : 'var(--canvas)', padding: '44px 36px 48px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {plan.badge && (
        <span style={{ position: 'absolute', top: 0, right: '36px', background: 'var(--blt)', color: 'var(--canvas)', fontFamily: 'var(--font-dm-sans)', fontSize: '8.5px', letterSpacing: '.14em', textTransform: 'uppercase', padding: '5px 12px', fontWeight: 500 }}>
          {plan.badge}
        </span>
      )}
      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '8.5px', letterSpacing: '.16em', textTransform: 'uppercase', color: featured ? 'rgba(244,237,225,.45)' : 'var(--muted)', padding: '4px 10px', display: 'inline-block', marginBottom: '28px', border: `1px solid ${featured ? 'rgba(255,255,255,.1)' : 'var(--rule)'}` }}>
        {plan.tag}
      </span>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '30px', fontWeight: 400, color: featured ? 'var(--linen)' : 'var(--esp)', lineHeight: 1.05, marginBottom: '8px' }}>{plan.name}</div>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.5)' : 'var(--mid)', marginBottom: '28px', lineHeight: 1.6 }}>{plan.tagline}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '58px', fontWeight: 300, lineHeight: 1, color: featured ? 'var(--linen)' : 'var(--esp)' }}>{plan.amount}</span>
        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.4)' : 'var(--muted)' }}>{plan.period}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11.5px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.35)' : 'var(--muted)', marginBottom: '32px' }}>{plan.equiv}</p>
      <div style={{ height: '1px', background: featured ? 'rgba(255,255,255,.08)' : 'var(--rule)', marginBottom: '28px' }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '13px', flex: 1 }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.6)' : 'var(--mid)', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.55 }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: featured ? 'rgba(196,168,130,.55)' : 'var(--blt)', flexShrink: 0, marginTop: '7px' }} />
            {f}
          </li>
        ))}
        {plan.crossedOut.map((f, i) => (
          <li key={`x${i}`} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: featured ? 'rgba(244,237,225,.18)' : 'var(--mid)', opacity: .35, textDecoration: 'line-through', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.55 }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--rule)', flexShrink: 0, marginTop: '7px' }} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href="/memberships"
        className="plan-cta"
        style={{
          display: 'block',
          textAlign: 'center',
          fontFamily: 'var(--font-dm-sans)',
          fontSize: '10px',
          fontWeight: 500,
          letterSpacing: '.16em',
          textTransform: 'uppercase',
          padding: '14px',
          border: `1px solid ${featured ? 'rgba(255,255,255,.22)' : 'var(--esp)'}`,
          color: featured ? 'var(--linen)' : 'var(--esp)',
          textDecoration: 'none',
        }}
      >
        {plan.cta}
      </Link>
    </div>
  )
}

/* ── Testimonials ──────────────────────────────────────────────────────────── */
function TestimonialsSection() {
  return (
    <section style={{ borderBottom: '1px solid var(--rule)', background: 'var(--canvas)' }}>
      <div className="sp mob-vpad" style={{ maxWidth: '1320px', margin: '0 auto', padding: '104px 48px' }}>
        <ScrollReveal>
          <div className="rflex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px' }}>
            <div>
              <div className="slbl">Member stories</div>
              <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', margin: 0 }}>
                What our <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>members say</em>
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {[1,2,3,4,5].map(i => (
                <svg key={i} width="13" height="13" viewBox="0 0 14 14" fill="var(--brown)"><path d="M7 1l1.5 4.2H13L9.3 7.8l1.4 4.2L7 9.5l-3.7 2.5 1.4-4.2L1 5.2h4.5z"/></svg>
              ))}
              <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', fontWeight: 300, color: 'var(--muted)', marginLeft: '8px' }}>Google reviews</span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="r3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
            {memberships.testimonials.map((t, i) => (
              <div key={i} style={{ background: 'var(--linen)', padding: '44px 36px 48px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '3px', marginBottom: '28px' }}>
                  {Array.from({ length: t.stars }).map((_, si) => (
                    <svg key={si} width="12" height="12" viewBox="0 0 14 14" fill="var(--brown)"><path d="M7 1l1.5 4.2H13L9.3 7.8l1.4 4.2L7 9.5l-3.7 2.5 1.4-4.2L1 5.2h4.5z"/></svg>
                  ))}
                </div>
                <blockquote style={{ fontFamily: 'var(--font-cormorant)', fontSize: '23px', fontStyle: 'italic', fontWeight: 300, color: 'var(--esp)', lineHeight: 1.45, margin: '0 0 32px', flex: 1 }}>
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '20px' }}>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--esp)', margin: '0 0 3px' }}>{t.name}</p>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '10.5px', fontWeight: 300, color: 'var(--muted)', margin: 0, letterSpacing: '.04em' }}>{t.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', paddingTop: '36px' }}>
            <Link href="/about#stories" className="btn-ghost">
              Read the full stories
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 8h10M9 4l4 4-4 4"/></svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

/* ── Contact ───────────────────────────────────────────────────────────────── */
function ContactSection() {
  return (
    <section style={{ borderBottom: '1px solid var(--rule)' }}>
      <div
        className="r2 sp"
        style={{ maxWidth: '1320px', margin: '0 auto', padding: '104px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '88px', alignItems: 'start' }}
      >
        {/* Info */}
        <ScrollReveal>
          <div>
            <div className="slbl">{home.contactSection.eyebrow}</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', marginBottom: '24px' }}>
              {home.contactSection.heading}{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>{home.contactSection.headingItalic}</em>
            </h2>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, marginBottom: '36px' }}>
              {home.contactSection.body}
            </p>
            <div>
              {[
                { label: 'Address', value: '132 Ayr Street, Doncaster VIC 3108' },
                { label: 'Hours',   value: 'Mon–Fri 6am–8pm · Sat 7am–2pm · Sun 8am–12pm' },
                { label: 'Email',   value: 'info@bodyforme.com.au' },
              ].map(({ label, value }) => (
                <div key={label} style={{ padding: '18px 0', borderTop: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '72px 1fr', gap: '16px', alignItems: 'start' }}>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: '3px' }}>{label}</span>
                  <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--text)', lineHeight: 1.6 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Form */}
        <ScrollReveal>
          <ContactForm />
        </ScrollReveal>
      </div>
    </section>
  )
}

function ContactForm() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    try {
      const res  = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (res.ok) { setSent(true); form.reset() }
      else        { setError('Something went wrong — please try again.') }
    } catch {
      setError('Something went wrong — please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) return (
    <div style={{ paddingTop: '12px' }}>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 300, color: 'var(--esp)', marginBottom: '12px' }}>Message sent</div>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75 }}>We&apos;ll get back to you within one business day.</p>
    </div>
  )

  return (
    <div style={{ paddingTop: '12px' }}>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 300, color: 'var(--esp)', marginBottom: '12px' }}>
        {home.contactSection.formHeading}
      </div>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 300, color: 'var(--mid)', marginBottom: '32px', lineHeight: 1.75 }}>
        We aim to respond within one business day.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        <div className="r2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <Field label="Name"  name="name"  type="text"  />
          <Field label="Email" name="email" type="email" />
        </div>
        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '10px' }}>Message</label>
          <textarea
            name="message"
            required
            rows={4}
            style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', padding: '8px 0', fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--text)', outline: 'none', resize: 'none' }}
          />
        </div>
        {error && <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', color: '#c0392b', marginBottom: '12px' }}>{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary" style={{ alignSelf: 'flex-start', opacity: loading ? 0.6 : 1 }}>
          {loading ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, name, type }: { label: string; name: string; type: string }) {
  return (
    <div>
      <label style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--muted)', display: 'block', marginBottom: '10px' }}>{label}</label>
      <input name={name} type={type} required style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid var(--rule)', padding: '8px 0', fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--text)', outline: 'none' }} />
    </div>
  )
}
