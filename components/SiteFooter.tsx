import Link from 'next/link'
import { studio } from '@/lib/content'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: 'var(--esp2)', paddingTop: '64px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 48px' }}>

        {/* Top grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '64px', paddingBottom: '56px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>

          {/* Brand col */}
          <div>
            <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '22px', fontWeight: 400, letterSpacing: '.06em', color: 'var(--linen)', marginBottom: '14px' }}>
              Body<em style={{ fontStyle: 'italic', color: '#c4a882' }}>forme</em>
            </div>
            <p style={{ fontSize: '12.5px', fontWeight: 300, color: 'rgba(244,237,225,.45)', lineHeight: 1.7, maxWidth: '240px' }}>
              {studio.tagline}<br />
              {studio.address}
            </p>
          </div>

          {/* Studio links */}
          <div>
            <div style={{ fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,.3)', marginBottom: '20px' }}>Studio</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { href: '/classes',     label: 'Classes'     },
                { href: '/memberships', label: 'Memberships' },
                { href: '/about',       label: 'About Us'    },
                { href: '/free-trial',  label: 'Free Trial'  },
              ].map(({ href, label }) => (
                <Link key={href} href={href} style={{ fontSize: '12.5px', fontWeight: 300, color: 'rgba(244,237,226,.5)', textDecoration: 'none', transition: 'color .2s' }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Visit */}
          <div>
            <div style={{ fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,.3)', marginBottom: '20px' }}>Visit</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 300, color: 'rgba(244,237,226,.5)', lineHeight: 1.6 }}>{studio.address}</span>
              <a href={`tel:${studio.phone}`} style={{ fontSize: '12.5px', fontWeight: 300, color: 'rgba(244,237,226,.5)', textDecoration: 'none' }}>{studio.phone}</a>
              <a href={`mailto:${studio.email}`} style={{ fontSize: '12.5px', fontWeight: 300, color: 'rgba(244,237,226,.5)', textDecoration: 'none' }}>{studio.email}</a>
            </div>
          </div>

          {/* Account */}
          <div>
            <div style={{ fontSize: '9px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,.3)', marginBottom: '20px' }}>Account</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { href: studio.bookingUrl, label: 'Book a class'   },
                { href: '/free-trial',     label: 'Free trial'     },
                { href: '/contact',        label: 'Get in touch'   },
              ].map(({ href, label }) => (
                <Link key={href} href={href} style={{ fontSize: '12.5px', fontWeight: 300, color: 'rgba(244,237,226,.5)', textDecoration: 'none', transition: 'color .2s' }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ padding: '20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: 'rgba(244,237,225,.25)', letterSpacing: '.04em' }}>
            © {year} BodyForme Pilates. All rights reserved.
          </span>
          <div style={{ display: 'flex', gap: '24px' }}>
            {[{ href: '/contact', label: 'Contact' }].map(({ href, label }) => (
              <Link key={href} href={href} style={{ fontSize: '11px', color: 'rgba(244,237,225,.25)', textDecoration: 'none', transition: 'color .2s' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
