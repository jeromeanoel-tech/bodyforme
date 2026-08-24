import Link from 'next/link'
import { studio } from '@/lib/content'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--esp)', color: 'var(--linen)' }}>

      {/* ── Top section ──────────────────────────────────────────────────── */}
      <div
        className="sp"
        style={{ maxWidth: '1320px', margin: '0 auto', padding: '80px 48px 64px' }}
      >
        <div
          className="footer-grid"
          style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr 1fr 1fr', gap: '64px' }}
        >
          {/* Brand */}
          <div>
            <img
              src="/bodyformeBlogo.png"
              alt="BodyForme"
              style={{ height: 32, width: 'auto', filter: 'brightness(0) invert(1)', opacity: .8, marginBottom: '20px', display: 'block' }}
            />
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '13px', fontWeight: 300, color: 'rgba(244,237,225,.4)', lineHeight: 1.8, maxWidth: '220px' }}>
              {studio.tagline}<br />
              {studio.address}
            </p>
            <p style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12px', fontWeight: 300, color: 'rgba(244,237,225,.3)', marginTop: '16px' }}>
              <a href={`tel:${studio.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{studio.phone}</a>
            </p>
          </div>

          {/* Studio */}
          <FooterCol heading="Studio" links={[
            { href: '/classes',     label: 'Classes'     },
            { href: '/memberships', label: 'Memberships' },
            { href: '/about',       label: 'About Us'    },
            { href: '/free-trial',  label: 'Free Trial'  },
          ]} />

          {/* Visit */}
          <FooterCol heading="Visit" links={[
            { href: '/contact',         label: 'Get in touch' },
            { href: `mailto:${studio.email}`, label: studio.email, external: true },
          ]}>
            <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: 'rgba(244,237,226,.38)', lineHeight: 1.7, display: 'block' }}>
              Mon–Fri 6am–8pm<br />
              Sat 7am–2pm<br />
              Sun 8am–12pm
            </span>
          </FooterCol>

          {/* Account */}
          <FooterCol heading="Account" links={[
            { href: '/app',          label: 'Member login'  },
            { href: '/free-trial',   label: 'Book free trial' },
            { href: studio.bookingUrl, label: 'Book a class', external: true },
          ]} />
        </div>
      </div>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{ height: '1px', background: 'rgba(255,255,255,.06)', maxWidth: '1320px', margin: '0 auto 0', padding: '0 48px' }}>
        <div style={{ height: '1px', background: 'rgba(255,255,255,.06)' }} />
      </div>

      {/* ── Bottom bar ────────────────────────────────────────────────────── */}
      <div
        className="sp footer-bottom"
        style={{
          maxWidth: '1320px',
          margin: '0 auto',
          padding: '20px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(244,237,225,.22)', letterSpacing: '.04em' }}>
          © {year} BodyForme Pilates. All rights reserved.
        </span>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/terms"   style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(244,237,225,.22)', textDecoration: 'none', transition: 'color .2s' }}>Terms</Link>
          <Link href="/contact" style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '11px', color: 'rgba(244,237,225,.22)', textDecoration: 'none', transition: 'color .2s' }}>Contact</Link>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  heading,
  links,
  children,
}: {
  heading: string
  links: { href: string; label: string; external?: boolean }[]
  children?: React.ReactNode
}) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '9px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(244,237,225,.28)', marginBottom: '20px', fontWeight: 400 }}>
        {heading}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {children}
        {links.map(({ href, label, external }) => (
          <Link
            key={href}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noopener noreferrer' : undefined}
            style={{ fontFamily: 'var(--font-dm-sans)', fontSize: '12.5px', fontWeight: 300, color: 'rgba(244,237,226,.42)', textDecoration: 'none', transition: 'color .2s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(244,237,226,.75)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(244,237,226,.42)' }}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
