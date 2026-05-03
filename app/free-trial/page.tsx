import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import Link from 'next/link'
import { freeTrial, studio } from '@/lib/content'

export const metadata = {
  title: 'Free Trial Class | BodyForme Pilates',
  description: 'Book your first Pilates class free at BodyForme in Doncaster. No credit card, no commitment.',
}

export default function FreeTrialPage() {
  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── HERO ── */}
      <section style={{ background: 'var(--esp)', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 48px 72px' }}>
          <div style={{ fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,.35)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '28px', height: '1px', background: 'rgba(196,168,130,.4)', display: 'block' }} />
            New members only · No credit card required
          </div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(52px,6vw,84px)', fontWeight: 400, lineHeight: 1.04, color: 'var(--linen)', letterSpacing: '-.01em', marginBottom: '28px', maxWidth: '700px' }}>
            {freeTrial.heading}<br />
            <em style={{ fontStyle: 'italic', fontWeight: 300, color: '#c4a882' }}>{freeTrial.headingItalic}</em>
          </h1>
          <p style={{ fontSize: '14px', fontWeight: 300, color: 'rgba(244,237,225,.6)', lineHeight: 1.8, maxWidth: '520px', marginBottom: '40px' }}>
            {freeTrial.body}
          </p>
          <Link
            href={studio.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--esp)', background: 'var(--linen)', padding: '16px 40px', textDecoration: 'none', display: 'inline-block', transition: 'background .2s' }}
          >
            {freeTrial.ctaText}
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px' }}>
          <ScrollReveal>
            <div className="slbl">How it works</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(36px,4vw,54px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', marginBottom: '56px' }}>
              Four simple <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>steps</em>
            </h2>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: 'var(--rule)', border: '1px solid var(--rule)' }}>
              {freeTrial.steps.map((step, i) => (
                <div key={i} style={{ background: 'var(--linen)', padding: '40px 32px' }}>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '48px', fontWeight: 300, color: 'var(--l3)', lineHeight: 1, marginBottom: '24px' }}>{step.n}</div>
                  <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.2, marginBottom: '12px' }}>{step.title}</div>
                  <p style={{ fontSize: '12.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── WHAT TO BRING ── */}
      <section style={{ background: 'var(--l2)', borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '72px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <ScrollReveal>
            <div className="slbl">Be prepared</div>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(32px,3.5vw,48px)', fontWeight: 400, lineHeight: 1.1, color: 'var(--esp)', marginBottom: '24px' }}>
              What to <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>bring</em>
            </h2>
            <p style={{ fontSize: '13.5px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.8 }}>
              {freeTrial.whatToBring}
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <div style={{ border: '1px solid var(--rule)', padding: '36px' }}>
              <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 400, color: 'var(--esp)', marginBottom: '20px' }}>
                Studio address
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {[
                  { label: 'Address', value: studio.address },
                  { label: 'Phone',   value: studio.phone   },
                  { label: 'Email',   value: studio.email   },
                ].map(({ label, value }) => (
                  <div key={label} style={{ padding: '14px 0', borderTop: '1px solid var(--rule)', display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px' }}>
                    <span style={{ fontSize: '9px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)', paddingTop: '2px' }}>{label}</span>
                    <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--text)' }}>{value}</span>
                  </div>
                ))}
                <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: '14px' }} />
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(studio.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: '20px', display: 'inline-block', fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brown)', borderBottom: '1px solid var(--brown)', paddingBottom: '2px', textDecoration: 'none' }}
              >
                Get directions →
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: 'var(--esp)', padding: '80px 48px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '48px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(28px,3vw,42px)', fontWeight: 300, color: 'var(--linen)', marginBottom: '8px' }}>
              Ready to <em style={{ fontStyle: 'italic', color: '#c4a882' }}>begin?</em>
            </h3>
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'rgba(244,237,225,.5)', lineHeight: 1.6 }}>
              Book your free trial class now. It takes two minutes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '16px', flexShrink: 0 }}>
            <Link
              href="/classes"
              style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--linen)', border: '1px solid rgba(255,255,255,.25)', padding: '13px 28px', textDecoration: 'none', display: 'inline-block' }}
            >
              View schedule
            </Link>
            <Link
              href={studio.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '10px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--esp)', background: 'var(--linen)', padding: '13px 28px', textDecoration: 'none', display: 'inline-block' }}
            >
              Book free trial
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
