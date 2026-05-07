'use client'

import { useState } from 'react'
import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import { memberships, studio } from '@/lib/content'

export default function MembershipsPage() {
  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── PAGE HERO ── */}
      <div style={{ background: 'var(--esp)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '72px 48px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'end' }}>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,.35)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '28px', height: '1px', background: 'rgba(196,168,130,.4)', display: 'block' }} />
              {memberships.page.eyebrow}
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(48px,5.5vw,76px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--linen)', letterSpacing: '-.01em' }}>
              {memberships.page.heading}<br />
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#c4a882' }}>{memberships.page.headingItalic}</em>
            </h1>
          </div>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.55)', lineHeight: 1.8, marginBottom: '32px' }}>
              {memberships.page.desc}
            </p>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              {memberships.page.trust.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11.5px', fontWeight: 300, color: 'rgba(244,237,225,.5)' }}>
                  <span style={{ width: '18px', height: '18px', border: '1px solid rgba(196,168,130,.4)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#c4a882', flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TRIAL BANNER ── */}
      <div style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px' }}>
          <div>
            <strong style={{ display: 'block', fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--esp)', marginBottom: '2px' }}>
              {memberships.trial.heading}
            </strong>
            <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)' }}>{memberships.trial.subtext}</span>
          </div>
          <Link
            href="/free-trial"
            style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--canvas)', background: 'var(--brown)', padding: '11px 24px', textDecoration: 'none', display: 'inline-block', transition: 'background .2s', whiteSpace: 'nowrap' }}
          >
            {memberships.trial.ctaText}
          </Link>
        </div>
      </div>

      {/* ── PLAN CARDS ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
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
                All memberships include access to every class type. Upgrade, downgrade or pause at any time.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {memberships.plans.map(plan => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── CASUAL PACKS ── */}
      <div style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '52px' }}>
              <div>
                <div className="slbl">Flexible options</div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', margin: 0 }}>
                  Passes &amp; <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>prepaid</em>
                </h2>
              </div>
              <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75, maxWidth: '360px', textAlign: 'right' }}>
                Class passes, short-stay options, and prepaid unlimited memberships. No weekly commitment required.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {memberships.packs.map((pack, i) => (
                <div key={i} style={{ background: 'var(--linen)', padding: '36px 28px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '42px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1, marginBottom: '12px' }}>{pack.price}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.1, marginBottom: '8px' }}>{pack.name}</div>
                  <p style={{ fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.6, flex: 1 }}>{pack.detail}</p>
                  <Link
                    href={`/sign-up?plan=${pack.planKey}`}
                    style={{ marginTop: '24px', display: 'block', textAlign: 'center', fontSize: '10px', fontWeight: 500, letterSpacing: '.12em', textTransform: 'uppercase', padding: '11px', border: '1px solid var(--esp)', color: 'var(--esp)', textDecoration: 'none', transition: 'all .2s' }}
                  >
                    {pack.planKey.includes('month') || pack.planKey.includes('year') ? 'Buy membership' : 'Buy now'}
                  </Link>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div className="slbl">Getting started</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)' }}>
              How it <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>works</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)', marginTop: '56px' }}>
              {memberships.howItWorks.map((step, i) => (
                <div key={i} style={{ background: 'var(--linen)', padding: '40px 32px' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '48px', fontWeight: 300, color: 'var(--l3)', lineHeight: 1, marginBottom: '24px' }}>{step.step}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.2, marginBottom: '12px' }}>
                    {step.title} <em style={{ fontStyle: 'italic', fontWeight: 300 }}>{step.titleItalic}</em>
                  </div>
                  <p style={{ fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div className="slbl">What members say</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)' }}>
              Heard in the <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>studio</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)', marginTop: '52px' }}>
              {memberships.testimonials.map((t, i) => (
                <div key={i} style={{ background: 'var(--canvas)', padding: '36px 32px' }}>
                  <div style={{ color: 'var(--blt)', fontSize: '13px', letterSpacing: '2px', marginBottom: '20px' }}>{'★'.repeat(t.stars)}</div>
                  <blockquote style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontStyle: 'italic', fontWeight: 300, color: 'var(--esp)', lineHeight: 1.45, marginBottom: '20px' }}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div style={{ height: '1px', background: 'var(--rule)', marginBottom: '16px' }} />
                  <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '2px' }}>{t.name}</div>
                  <div style={{ fontSize: '11px', fontWeight: 300, color: 'var(--muted)', letterSpacing: '.04em' }}>{t.detail}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px' }}>
              <div>
                <div className="slbl">Questions</div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', marginBottom: '20px' }}>
                  Common <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>questions</em>
                </h2>
                <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.8, marginBottom: '36px' }}>
                  Can&apos;t find what you&apos;re looking for? We&apos;re always happy to help.
                </p>
                <Link
                  href="/contact"
                  style={{ fontSize: '10.5px', fontWeight: 400, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brown)', borderBottom: '1px solid var(--brown)', paddingBottom: '2px', display: 'inline-block', textDecoration: 'none' }}
                >
                  Get in touch →
                </Link>
              </div>
              <FaqList />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── SIGN-UP CTA ── */}
      <div style={{ background: 'var(--esp)', padding: '80px 48px' }} id="signup">
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--linen)', marginBottom: '16px' }}>
              Ready to <em style={{ fontStyle: 'italic', color: '#c4a882' }}>start?</em>
            </h2>
            <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'rgba(244,237,225,.55)', lineHeight: 1.75 }}>
              Your first class is free — no credit card, no commitment. Choose the plan that works for you and start your practice today.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)', padding: '36px' }}>
            <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--linen)', marginBottom: '24px' }}>
              Get started today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Link
                href="/free-trial"
                style={{ display: 'block', textAlign: 'center', fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--esp)', background: 'var(--linen)', padding: '15px', textDecoration: 'none', transition: 'background .2s' }}
              >
                Book free trial
              </Link>
              <Link
                href={studio.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--linen)', border: '1px solid rgba(255,255,255,.25)', padding: '15px', textDecoration: 'none', transition: 'border-color .2s' }}
              >
                View full schedule
              </Link>
            </div>
            <p style={{ fontSize: '11px', fontWeight: 300, color: 'rgba(244,237,225,.25)', textAlign: 'center', marginTop: '14px', lineHeight: 1.5 }}>
              No joining fee. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({ plan }: { plan: typeof memberships.plans[0] }) {
  const f = plan.featured
  return (
    <div style={{ background: f ? 'var(--esp)' : 'var(--linen)', padding: '40px 36px 44px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {plan.badge && (
        <span style={{ position: 'absolute', top: 0, right: '36px', background: 'var(--blt)', color: 'var(--canvas)', fontSize: '9px', letterSpacing: '.12em', textTransform: 'uppercase', padding: '5px 12px', fontWeight: 500 }}>
          {plan.badge}
        </span>
      )}
      <span style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: f ? 'rgba(244,237,225,.5)' : 'var(--muted)', padding: '4px 10px', display: 'inline-block', marginBottom: '28px', border: `1px solid ${f ? 'rgba(255,255,255,.12)' : 'var(--rule)'}` }}>
        {plan.tag}
      </span>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '32px', fontWeight: 400, color: f ? 'var(--linen)' : 'var(--esp)', lineHeight: 1.05, marginBottom: '6px' }}>{plan.name}</div>
      <p style={{ fontSize: '12.5px', fontWeight: 300, color: f ? 'rgba(244,237,225,.55)' : 'var(--mid)', marginBottom: '28px', lineHeight: 1.5 }}>{plan.tagline}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '56px', fontWeight: 300, lineHeight: 1, color: f ? 'var(--linen)' : 'var(--esp)' }}>{plan.amount}</span>
        <span style={{ fontSize: '12px', fontWeight: 300, color: f ? 'rgba(244,237,225,.45)' : 'var(--muted)' }}>{plan.period}</span>
      </div>
      <p style={{ fontSize: '11.5px', fontWeight: 300, color: f ? 'rgba(244,237,225,.4)' : 'var(--muted)', marginBottom: '32px' }}>{plan.equiv}</p>
      <div style={{ height: '1px', background: f ? 'rgba(255,255,255,.1)' : 'var(--rule)', marginBottom: '28px' }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '13px', flex: 1 }}>
        {plan.features.map((feat, i) => (
          <li key={i} style={{ fontSize: '12.5px', fontWeight: 300, color: f ? 'rgba(244,237,225,.65)' : 'var(--mid)', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.5 }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: f ? 'rgba(196,168,130,.6)' : 'var(--blt)', flexShrink: 0, marginTop: '7px' }} />
            {feat}
          </li>
        ))}
        {plan.crossedOut.map((feat, i) => (
          <li key={`x${i}`} style={{ fontSize: '12.5px', fontWeight: 300, color: f ? 'rgba(244,237,225,.2)' : 'var(--mid)', opacity: .4, textDecoration: 'line-through', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.5 }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--rule)', flexShrink: 0, marginTop: '7px' }} />
            {feat}
          </li>
        ))}
      </ul>
      <Link
        href={`/sign-up?plan=${plan.planKey}`}
        style={{ display: 'block', textAlign: 'center', fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', padding: '14px', border: `1px solid ${f ? 'rgba(255,255,255,.25)' : 'var(--esp)'}`, color: f ? 'var(--linen)' : 'var(--esp)', textDecoration: 'none', transition: 'all .2s' }}
      >
        {plan.cta}
      </Link>
    </div>
  )
}

// ── FAQ accordion (client component) ─────────────────────────────────────────

function FaqList() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div>
      {memberships.faqs.map((faq, i) => (
        <div key={i} className={`faq-item${open === i ? ' open' : ''}`} style={{ borderTop: '1px solid var(--rule)', ...(i === memberships.faqs.length - 1 ? { borderBottom: '1px solid var(--rule)' } : {}) }}>
          <div
            onClick={() => setOpen(open === i ? null : i)}
            style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '24px', userSelect: 'none' }}
          >
            <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.4 }}>{faq.q}</span>
            <span
              className="faq-toggle"
              style={{ width: '24px', height: '24px', border: `1px solid ${open === i ? 'var(--esp)' : 'var(--rule)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: open === i ? 'var(--canvas)' : 'var(--muted)', fontSize: '16px', flexShrink: 0, background: open === i ? 'var(--esp)' : 'transparent', fontWeight: 300 }}
            >
              +
            </span>
          </div>
          <div className="faq-answer">
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.75, maxWidth: '560px' }}>{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
