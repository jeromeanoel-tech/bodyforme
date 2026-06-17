import Link from 'next/link'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import { studio } from '@/lib/content'

export const metadata = {
  title: 'You\'re all set | BodyForme Pilates',
}

type Props = {
  searchParams: { type?: string }
}

export default function SignUpSuccessPage({ searchParams }: Props) {
  const type = searchParams.type ?? 'subscription'

  const content = {
    subscription: {
      eyebrow:   'Membership activated',
      heading:   'Welcome to',
      italic:    'BodyForme',
      body:      'Your membership is now active. You\'ll receive a confirmation email with your payment receipt and membership details shortly. You can start booking classes straight away.',
      next: [
        { label: 'Install the app',   href: '/app/install', primary: true  },
        { label: 'View the schedule', href: '/classes',      primary: false },
      ],
    },
    payment: {
      eyebrow:   'Purchase confirmed',
      heading:   'Your class pack',
      italic:    'is ready',
      body:      'Your class credits have been added to your account. You\'ll receive a receipt by email. You can start booking whenever you\'re ready.',
      next: [
        { label: 'Install the app',   href: '/app/install', primary: true  },
        { label: 'View the schedule', href: '/classes',      primary: false },
      ],
    },
    trial: {
      eyebrow:   'Registration received',
      heading:   'Your free trial',
      italic:    'is confirmed',
      body:      'Thanks for registering. We\'ll be in touch within one business day to confirm your first class. Check your email for a confirmation from us.',
      next: [
        { label: 'Install the app',   href: '/app/install', primary: true  },
        { label: 'View the schedule', href: '/classes',      primary: false },
      ],
    },
    existing: {
      eyebrow:   'Account created',
      heading:   'Welcome to',
      italic:    'BodyForme',
      body:      'You\'re all set. Log in to the member app to view your timetable, book classes, and manage your membership.',
      next: [
        { label: 'Install the app',   href: '/app/install', primary: true  },
        { label: 'View the schedule', href: '/classes',      primary: false },
      ],
    },
  }

  const c = content[type as keyof typeof content] ?? content.existing

  return (
    <div className="site-body">
      <SiteHeader />

      {/* ── Success section ── */}
      <section style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--rule)' }}>
        <div className="r2 sp" style={{ maxWidth: '1280px', margin: '0 auto', padding: '88px 48px', width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

          {/* Left: confirmation message */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{ width: '40px', height: '40px', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                  <path d="M1.5 7L6.5 12L16.5 2" stroke="var(--brown)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                {c.eyebrow}
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px,4.5vw,64px)', fontWeight: 400, lineHeight: 1.04, color: 'var(--esp)', marginBottom: '28px' }}>
              {c.heading}<br />
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>{c.italic}</em>
            </h1>

            <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.8, marginBottom: '40px', maxWidth: '440px' }}>
              {c.body}
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {c.next.map(({ label, href, primary }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase',
                    padding: '14px 32px', textDecoration: 'none', display: 'inline-block', transition: 'all .2s',
                    ...(primary
                      ? { color: 'var(--canvas)', background: 'var(--esp)', border: '1px solid var(--esp)' }
                      : { color: 'var(--esp)', background: 'transparent', border: '1px solid var(--esp)' }
                    ),
                  }}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right: what's next card */}
          <div style={{ border: '1px solid var(--rule)', padding: '40px' }}>
            <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 400, color: 'var(--esp)', marginBottom: '28px' }}>
              What happens next
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(type === 'existing' ? [
                { n: '01', text: 'Check your email for a welcome message from BodyForme.' },
                { n: '02', text: 'Install the member app on your phone — tap the button below for step-by-step instructions.' },
                { n: '03', text: 'Log in with your email and the password you just created.' },
                { n: '04', text: 'Browse the timetable and book your next class.' },
              ] : [
                { n: '01', text: 'Check your email for a confirmation from BodyForme.' },
                { n: '02', text: 'Install the member app on your phone — tap the button below for step-by-step instructions.' },
                { n: '03', text: 'Browse the timetable and book your first class.' },
                { n: '04', text: 'Arrive 10 minutes early — our team will be there to welcome you.' },
              ]).map(item => (
                <div key={item.n} style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: '16px', padding: '18px 0', borderTop: '1px solid var(--rule)', alignItems: 'start' }}>
                  <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '20px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1 }}>{item.n}</span>
                  <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7 }}>{item.text}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid var(--rule)', paddingTop: '20px', marginTop: '4px' }}>
                <p style={{ fontSize: '12px', fontWeight: 300, color: 'var(--muted)', marginBottom: '4px' }}>Questions?</p>
                <a href={`mailto:${studio.email}`} style={{ fontSize: '13px', fontWeight: 300, color: 'var(--brown)', textDecoration: 'none', borderBottom: '1px solid var(--brown)', paddingBottom: '2px' }}>
                  {studio.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── App install section ── */}
      <section style={{ borderBottom: '1px solid var(--rule)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 48px' }}>

          <div style={{ marginBottom: '56px' }}>
            <span style={{ fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--muted)' }}>Step 2</span>
            <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(32px,3.5vw,52px)', fontWeight: 400, lineHeight: 1.08, color: 'var(--esp)', marginTop: '12px' }}>
              Add BodyForme to your<br />
              <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>home screen</em>
            </h2>
            <p style={{ fontSize: '14px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.8, marginTop: '16px', maxWidth: '520px' }}>
              There&apos;s nothing to download — the app lives on the web. Follow the steps for your phone below to add it to your home screen for one-tap access.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px' }}>

            {/* iPhone */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--rule)', marginBottom: '0' }}>
                <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 400, color: 'var(--esp)', margin: 0 }}>
                  <em style={{ fontStyle: 'italic', color: 'var(--brown)' }}>iPhone</em> &amp; iPad
                </h3>
                <span style={{ fontSize: '10px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Use Safari</span>
              </div>
              {[
                { n: '1', text: 'Open bodyforme.com.au/app in Safari (not Chrome).' },
                { n: '2', text: 'Tap the Share button — the square with an arrow at the bottom of the screen.' },
                { n: '3', text: 'Scroll down and tap "Add to Home Screen".' },
                { n: '4', text: 'Tap "Add" in the top-right corner.' },
                { n: '5', text: 'The BodyForme icon now appears on your home screen.' },
              ].map(step => (
                <div key={step.n} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: '16px', padding: '18px 0', borderBottom: '1px solid var(--rule)', alignItems: 'start' }}>
                  <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '18px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1 }}>{step.n}</span>
                  <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7 }}>{step.text}</span>
                </div>
              ))}
            </div>

            {/* Android */}
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--rule)', marginBottom: '0' }}>
                <h3 style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', fontWeight: 400, color: 'var(--esp)', margin: 0 }}>
                  <em style={{ fontStyle: 'italic', color: 'var(--brown)' }}>Android</em>
                </h3>
                <span style={{ fontSize: '10px', letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--muted)' }}>Use Chrome</span>
              </div>
              {[
                { n: '1', text: 'Open bodyforme.com.au/app in Chrome.' },
                { n: '2', text: 'Tap the three-dot menu in the top-right corner.' },
                { n: '3', text: 'Tap "Install app" or "Add to Home screen".' },
                { n: '4', text: 'Tap "Install" to confirm.' },
                { n: '5', text: 'The BodyForme icon now appears with your other apps.' },
              ].map(step => (
                <div key={step.n} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: '16px', padding: '18px 0', borderBottom: '1px solid var(--rule)', alignItems: 'start' }}>
                  <span style={{ fontFamily: 'var(--font-cormorant)', fontSize: '18px', fontWeight: 300, color: 'var(--muted)', lineHeight: 1 }}>{step.n}</span>
                  <span style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', lineHeight: 1.7 }}>{step.text}</span>
                </div>
              ))}
            </div>

          </div>

          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ fontSize: '13px', fontWeight: 300, color: 'var(--mid)', margin: 0 }}>
              Need the full visual guide with screenshots?
            </p>
            <Link href="/app/install" style={{ fontSize: '10.5px', fontWeight: 500, letterSpacing: '.14em', textTransform: 'uppercase', padding: '12px 28px', textDecoration: 'none', color: 'var(--esp)', border: '1px solid var(--esp)' }}>
              View full install guide
            </Link>
          </div>

        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
