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
        <div
          className="r2 sp"
          style={{ maxWidth: '1320px', margin: '0 auto', padding: '80px 48px 72px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'end' }}
        >
          <div>
            <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9.5px', letterSpacing: '.22em', textTransform: 'uppercase', color: 'rgba(244,237,225,.32)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '28px', height: '1px', background: 'rgba(196,168,130,.38)', display: 'block' }} />
              {memberships.page.eyebrow}
            </div>
            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(48px,5.5vw,80px)', fontWeight: 400, lineHeight: 1.03, color: 'var(--linen)', letterSpacing: '-.02em' }}>
              {memberships.page.heading}<br />
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#c4a882' }}>{memberships.page.headingItalic}</em>
            </h1>
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.52)', lineHeight: 1.85, marginBottom: '32px' }}>
              {memberships.page.desc}
            </p>
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
              {memberships.page.trust.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 300, color: 'rgba(244,237,225,.45)' }}>
                  <span style={{ width: '16px', height: '16px', border: '1px solid rgba(196,168,130,.38)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#c4a882', flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TRIAL BANNER ── */}
      <div style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)' }}>
        <div
          className="rcta sp"
          style={{ maxWidth: '1320px', margin: '0 auto', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '40px' }}
        >
          <div>
            <strong style={{ display: 'block', fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 400, color: 'var(--esp)', marginBottom: '3px' }}>
              {memberships.trial.heading}
            </strong>
            <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 300, color: 'var(--mid)' }}>{memberships.trial.subtext}</span>
          </div>
          <Link href="/free-trial" className="btn-primary" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
            {memberships.trial.ctaText}
          </Link>
        </div>
      </div>

      {/* ── PLAN CARDS ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '96px 48px' }}>
          <ScrollReveal>
            <div className="rflex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px' }}>
              <div>
                <div className="slbl">Membership plans</div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', margin: 0 }}>
                  Find your <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>fit</em>
                </h2>
              </div>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, maxWidth: '280px', textAlign: 'right' }}>
                All memberships include access to every class type. Upgrade, downgrade or pause at any time.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="r3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {memberships.plans.map(plan => (
                <PlanCard key={plan.name} plan={plan} />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── CASUAL PACKS ── */}
      <div style={{ background: 'var(--canvas)', borderBottom: '1px solid var(--rule)' }}>
        <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '96px 48px' }}>
          <ScrollReveal>
            <div className="rflex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px' }}>
              <div>
                <div className="slbl">Flexible options</div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', margin: 0 }}>
                  Passes &amp; <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>prepaid</em>
                </h2>
              </div>
              <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, maxWidth: '340px', textAlign: 'right' }}>
                Class passes, short-stay options, and prepaid unlimited memberships. No weekly commitment required.
              </p>
            </div>
          </ScrollReveal>
          <ScrollReveal>
            <div className="r2c" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {memberships.packs.map((pack, i) => (
                <div key={i} style={{ background: 'var(--linen)', padding: '36px 30px', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '44px', fontWeight: 300, color: 'var(--esp)', lineHeight: 1, marginBottom: '10px' }}>{pack.price}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.1, marginBottom: '10px' }}>{pack.name}</div>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7, flex: 1 }}>{pack.detail}</p>
                  <Link
                    href={`/sign-up?plan=${pack.planKey}`}
                    style={{
                      marginTop: '24px',
                      display: 'block',
                      textAlign: 'center',
                      fontFamily: 'var(--font-dm-sans)',
                      fontSize: '9.5px',
                      fontWeight: 500,
                      letterSpacing: '.14em',
                      textTransform: 'uppercase',
                      padding: '12px',
                      border: '1px solid var(--esp)',
                      color: 'var(--esp)',
                      textDecoration: 'none',
                      transition: 'background .2s, color .2s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--esp)'; (e.currentTarget as HTMLElement).style.color = 'var(--canvas)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; (e.currentTarget as HTMLElement).style.color = 'var(--esp)' }}
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
      <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--l2)' }}>
        <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '96px 48px' }}>
          <ScrollReveal>
            <div className="slbl">Getting started</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', marginBottom: '0' }}>
              How it <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>works</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div className="r4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)', marginTop: '56px' }}>
              {memberships.howItWorks.map((step, i) => (
                <div key={i} style={{ background: 'var(--canvas)', padding: '44px 32px' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '52px', fontWeight: 300, color: 'var(--l3)', lineHeight: 1, marginBottom: '28px' }}>{step.step}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.15, marginBottom: '14px' }}>
                    {step.title} <em style={{ fontStyle: 'italic', fontWeight: 300 }}>{step.titleItalic}</em>
                  </div>
                  <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.8 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div style={{ borderBottom: '1px solid var(--rule)' }}>
        <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '96px 48px' }}>
          <ScrollReveal>
            <div className="slbl">What members say</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', marginBottom: '0' }}>
              Heard in the <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>studio</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div className="r3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)', marginTop: '52px' }}>
              {memberships.testimonials.map((t, i) => (
                <div key={i} style={{ background: 'var(--linen)', padding: '40px 32px 44px' }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '24px' }}>
                    {Array.from({ length: t.stars }).map((_, si) => (
                      <svg key={si} width="12" height="12" viewBox="0 0 14 14" fill="var(--brown)"><path d="M7 1l1.5 4.2H13L9.3 7.8l1.4 4.2L7 9.5l-3.7 2.5 1.4-4.2L1 5.2h4.5z"/></svg>
                    ))}
                  </div>
                  <blockquote style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontStyle: 'italic', fontWeight: 300, color: 'var(--esp)', lineHeight: 1.45, marginBottom: '24px' }}>
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <div style={{ height: '1px', background: 'var(--rule)', marginBottom: '18px' }} />
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 500, color: 'var(--text)', marginBottom: '3px' }}>{t.name}</div>
                  <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', fontWeight: 300, color: 'var(--muted)', letterSpacing: '.04em' }}>{t.detail}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ borderBottom: '1px solid var(--rule)', background: 'var(--canvas)' }}>
        <div className="sp" style={{ maxWidth: '1320px', margin: '0 auto', padding: '96px 48px' }}>
          <ScrollReveal>
            <div className="r2" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '80px' }}>
              <div>
                <div className="slbl">Questions</div>
                <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,52px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--esp)', marginBottom: '20px' }}>
                  Common <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>questions</em>
                </h2>
                <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, marginBottom: '36px' }}>
                  Can&apos;t find what you&apos;re looking for? We&apos;re always happy to help.
                </p>
                <Link href="/contact" className="btn-ghost">
                  Get in touch →
                </Link>
              </div>
              <FaqList />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* ── SIGN-UP CTA ── */}
      <div className="sp" style={{ background: 'var(--esp)', padding: '88px 48px' }} id="signup">
        <div
          className="r2"
          style={{ maxWidth: '1320px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}
        >
          <div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,62px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--linen)', marginBottom: '18px' }}>
              Ready to <em style={{ fontStyle: 'italic', color: '#c4a882' }}>start?</em>
            </h2>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.5)', lineHeight: 1.85 }}>
              Your first class is free — no credit card, no commitment. Choose the plan that works for you and start your practice today.
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', padding: '40px' }}>
            <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 400, color: 'var(--linen)', marginBottom: '28px' }}>
              Get started today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Link
                href="/free-trial"
                style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-dm-sans)', fontSize: '10.5px', fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--esp)', background: 'var(--linen)', padding: '16px', textDecoration: 'none', transition: 'background .2s' }}
              >
                Book free trial
              </Link>
              <Link
                href={studio.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-dm-sans)', fontSize: '10.5px', fontWeight: 400, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--linen)', border: '1px solid rgba(255,255,255,.22)', padding: '15px', textDecoration: 'none', transition: 'border-color .2s' }}
              >
                View full schedule
              </Link>
            </div>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', fontWeight: 300, color: 'rgba(244,237,225,.22)', textAlign: 'center', marginTop: '16px', lineHeight: 1.6 }}>
              No joining fee. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}

/* ── Plan card ─────────────────────────────────────────────────────────────── */
function PlanCard({ plan }: { plan: typeof memberships.plans[0] }) {
  const f = plan.featured
  return (
    <div style={{ background: f ? 'var(--esp)' : 'var(--canvas)', padding: '44px 36px 48px', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {plan.badge && (
        <span style={{ position: 'absolute', top: 0, right: '36px', background: 'var(--blt)', color: 'var(--canvas)', fontFamily: 'var(--font-dm-sans)', fontSize: '8.5px', letterSpacing: '.14em', textTransform: 'uppercase', padding: '5px 12px', fontWeight: 500 }}>
          {plan.badge}
        </span>
      )}
      <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '8.5px', letterSpacing: '.16em', textTransform: 'uppercase', color: f ? 'rgba(244,237,225,.45)' : 'var(--muted)', padding: '4px 10px', display: 'inline-block', marginBottom: '28px', border: `1px solid ${f ? 'rgba(255,255,255,.1)' : 'var(--rule)'}` }}>
        {plan.tag}
      </span>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '30px', fontWeight: 400, color: f ? 'var(--linen)' : 'var(--esp)', lineHeight: 1.05, marginBottom: '8px' }}>{plan.name}</div>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: f ? 'rgba(244,237,225,.5)' : 'var(--mid)', marginBottom: '28px', lineHeight: 1.6 }}>{plan.tagline}</p>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
        <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '58px', fontWeight: 300, lineHeight: 1, color: f ? 'var(--linen)' : 'var(--esp)' }}>{plan.amount}</span>
        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 300, color: f ? 'rgba(244,237,225,.4)' : 'var(--muted)' }}>{plan.period}</span>
      </div>
      <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11.5px', fontWeight: 300, color: f ? 'rgba(244,237,225,.35)' : 'var(--muted)', marginBottom: '32px' }}>{plan.equiv}</p>
      <div style={{ height: '1px', background: f ? 'rgba(255,255,255,.08)' : 'var(--rule)', marginBottom: '28px' }} />
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: '13px', flex: 1 }}>
        {plan.features.map((feat, i) => (
          <li key={i} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: f ? 'rgba(244,237,225,.6)' : 'var(--mid)', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.55 }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: f ? 'rgba(196,168,130,.55)' : 'var(--blt)', flexShrink: 0, marginTop: '7px' }} />
            {feat}
          </li>
        ))}
        {plan.crossedOut.map((feat, i) => (
          <li key={`x${i}`} style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: f ? 'rgba(244,237,225,.18)' : 'var(--mid)', opacity: .35, textDecoration: 'line-through', display: 'flex', alignItems: 'flex-start', gap: '10px', lineHeight: 1.55 }}>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--rule)', flexShrink: 0, marginTop: '7px' }} />
            {feat}
          </li>
        ))}
      </ul>
      <Link
        href={`/sign-up?plan=${plan.planKey}`}
        className="plan-cta"
        style={{ display: 'block', textAlign: 'center', fontFamily: 'var(--font-dm-sans)', fontSize: '10px', fontWeight: 500, letterSpacing: '.16em', textTransform: 'uppercase', padding: '14px', border: `1px solid ${f ? 'rgba(255,255,255,.22)' : 'var(--esp)'}`, color: f ? 'var(--linen)' : 'var(--esp)', textDecoration: 'none' }}
      >
        {plan.cta}
      </Link>
    </div>
  )
}

/* ── FAQ ───────────────────────────────────────────────────────────────────── */
function FaqList() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div style={{ paddingTop: '8px' }}>
      {memberships.faqs.map((faq, i) => (
        <div
          key={i}
          className={`faq-item${open === i ? ' open' : ''}`}
          style={{
            borderTop: '1px solid var(--rule)',
            ...(i === memberships.faqs.length - 1 ? { borderBottom: '1px solid var(--rule)' } : {}),
          }}
        >
          <div
            onClick={() => setOpen(open === i ? null : i)}
            style={{ padding: '22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '24px', userSelect: 'none' }}
          >
            <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '14px', fontWeight: open === i ? 400 : 300, color: 'var(--esp)', lineHeight: 1.5, transition: 'font-weight .2s' }}>{faq.q}</span>
            <span
              className="faq-toggle"
              style={{
                width: '22px',
                height: '22px',
                border: `1px solid ${open === i ? 'var(--esp)' : 'var(--rule)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: open === i ? 'var(--canvas)' : 'var(--muted)',
                fontSize: '15px',
                flexShrink: 0,
                background: open === i ? 'var(--esp)' : 'transparent',
                fontWeight: 300,
                transition: 'background .2s, border-color .2s, color .2s',
              }}
            >
              +
            </span>
          </div>
          <div className="faq-answer">
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85, maxWidth: '540px' }}>{faq.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
