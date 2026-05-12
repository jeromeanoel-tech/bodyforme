import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export const metadata = {
  title: 'Terms & Privacy | BodyForme Pilates',
  description: 'Terms and conditions and privacy policy for BodyForme Pilates Studio, Doncaster.',
}

const LAST_UPDATED = '9 May 2026'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 28, fontWeight: 400, color: 'var(--esp)', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--rule)' }}>
        {title}
      </h2>
      <div style={{ fontSize: 14, fontWeight: 300, color: 'var(--mid)', lineHeight: 1.85 }}>
        {children}
      </div>
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ marginBottom: 14 }}>{children}</p>
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul style={{ paddingLeft: 20, marginBottom: 14 }}>
      {items.map((item, i) => <li key={i} style={{ marginBottom: 6 }}>{item}</li>)}
    </ul>
  )
}

export default function TermsPage() {
  return (
    <div className="site-body">
      <SiteHeader />

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 48px 96px' }}>

        {/* Header */}
        <div style={{ marginBottom: 56, paddingBottom: 32, borderBottom: '1px solid var(--rule)' }}>
          <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 16 }}>
            Legal
          </div>
          <h1 style={{ fontFamily: 'var(--font-cormorant)', fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 400, color: 'var(--esp)', lineHeight: 1.1, marginBottom: 16 }}>
            Terms &amp; <em style={{ fontStyle: 'italic', fontWeight: 300, color: 'var(--brown)' }}>Privacy</em>
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 300 }}>
            Last updated {LAST_UPDATED} · BodyForme Pilates, 132 Ayr Street, Doncaster VIC 3108
          </p>
        </div>

        {/* Terms of Service */}
        <Section title="Terms of Service">
          <P>By purchasing a membership, class pack, or attending any class at BodyForme Pilates (&ldquo;the Studio&rdquo;), you agree to the following terms.</P>

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Memberships</h3>
          <Ul items={[
            'Recurring memberships are billed monthly on your nominated billing date via Stripe.',
            'Memberships auto-renew unless cancelled before the next billing date.',
            'Class credits included in your plan expire at the end of each billing cycle and do not roll over.',
            'To pause or cancel your membership, contact the studio at least 5 business days before your next billing date.',
            'Pauses are available for a minimum of 2 weeks and a maximum of 8 weeks per calendar year.',
            'The Studio reserves the right to cancel a membership with 14 days’ notice if a member repeatedly fails to attend bookings without cancelling.',
          ]} />

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Class Packs</h3>
          <Ul items={[
            '5-class packs expire 2 months from the date of purchase.',
            '10-class packs expire 3 months from the date of purchase.',
            'Expired credits cannot be extended or refunded.',
            'Class packs are non-transferable.',
          ]} />

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Bookings &amp; Cancellations</h3>
          <Ul items={[
            'Bookings can be made online via the Studio website or member app.',
            'Please cancel at least 2 hours before class to avoid a late cancel fee of $10.',
            'No-shows forfeit the class credit and may incur a $15 no-show fee.',
            'The Studio reserves the right to cancel or reschedule classes with reasonable notice.',
          ]} />

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Free Trial</h3>
          <Ul items={[
            'One free trial class is available per person.',
            'The free trial is non-transferable and has no cash value.',
            'Misuse of the free trial offer may result in being charged the casual rate.',
          ]} />

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Health &amp; Safety</h3>
          <Ul items={[
            'All classes take place in a heated studio. Please consult your doctor before attending if you have any medical conditions.',
            'You attend classes at your own risk. The Studio is not liable for injury or illness arising from participation.',
            'Please inform your instructor of any injuries or medical conditions before class.',
            'Children under 16 are not permitted in class.',
          ]} />

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Payments &amp; Refunds</h3>
          <Ul items={[
            'All prices are in Australian dollars (AUD) and include GST where applicable.',
            'Membership fees are non-refundable once charged.',
            'If a payment fails, your access may be suspended until the outstanding amount is cleared.',
            'Refunds for class packs are issued at the Studio’s discretion for unused credits only.',
          ]} />
        </Section>

        {/* Privacy Policy */}
        <Section title="Privacy Policy">
          <P>BodyForme Pilates is committed to protecting your personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles (APPs).</P>

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>What we collect</h3>
          <Ul items={[
            'Name, email address and phone number when you register or book.',
            'Payment information — processed and stored securely by Stripe. We do not store card or bank details directly.',
            'Booking and attendance history.',
            'Health information you voluntarily provide (e.g. injuries disclosed to instructors).',
            'Device and usage data when you use the member app or website (e.g. IP address, browser type).',
          ]} />

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>How we use it</h3>
          <Ul items={[
            'To manage your membership and bookings.',
            'To send booking confirmations, reminders and billing notifications.',
            'To contact you about your account, class changes or promotions (you can opt out at any time).',
            'To improve the Studio’s services and class scheduling.',
          ]} />

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Who we share it with</h3>
          <Ul items={[
            'Stripe — for payment processing.',
            'Wix — for booking management.',
            'Resend — for transactional emails.',
            'We do not sell your personal information to third parties.',
          ]} />

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Your rights</h3>
          <P>You may request access to, correction of, or deletion of your personal information at any time by emailing <a href="mailto:hello@bodyforme.com.au" style={{ color: 'var(--brown)', textDecoration: 'underline' }}>hello@bodyforme.com.au</a>. We will respond within 30 days.</P>

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Cookies</h3>
          <P>The website and member app use cookies and local storage to maintain your login session. No third-party advertising cookies are used.</P>

          <h3 style={{ fontSize: 16, fontWeight: 500, color: 'var(--esp)', margin: '24px 0 8px' }}>Security</h3>
          <P>Passwords are stored using industry-standard bcrypt hashing. All data is transmitted over HTTPS. Payment data is handled exclusively by Stripe, which is PCI DSS Level 1 certified.</P>
        </Section>

        {/* Contact */}
        <Section title="Contact">
          <P>Questions about these terms or your privacy? Get in touch:</P>
          <Ul items={[
            'Email: hello@bodyforme.com.au',
            'Address: 132 Ayr Street, Doncaster VIC 3108',
            'Phone: (03) XXXX XXXX',
          ]} />
          <p style={{ marginTop: 24, fontSize: 13, color: 'var(--muted)', fontWeight: 300, lineHeight: 1.85 }}>
            These terms are governed by the laws of Victoria, Australia. By using our services you agree to the exclusive jurisdiction of the Victorian courts.
          </p>
        </Section>

      </div>

      <SiteFooter />
    </div>
  )
}
