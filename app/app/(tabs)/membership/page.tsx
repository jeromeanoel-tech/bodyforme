'use client'

import { useSession } from '@/components/app/SessionProvider'

const T = {
  linen:  '#f4ede1',
  l2:     '#ede4d4',
  esp:    '#2a1506',
  brown:  '#7a4a2a',
  sand:   '#c4a882',
  mid:    '#6b4e36',
  muted:  '#a08568',
  rule:   '#d8ccba',
  canvas: '#fdfaf6',
  rust:   '#9a5a3a',
}

function ActionRow({ icon, label, sub, danger, last }: {
  icon:    React.ReactNode
  label:   string
  sub?:    string
  danger?: boolean
  last?:   boolean
  href?:   string
}) {
  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: last ? 'none' : `1px solid ${T.rule}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{
        width: 32, height: 32, border: `1px solid ${T.rule}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{icon}</svg>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: danger ? T.rust : T.esp }}>{label}</div>
        {sub && <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: T.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <svg width="6" height="11" viewBox="0 0 6 11" fill="none">
        <path d="M1 1l4 4.5L1 10" stroke={T.muted} strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export default function MembershipPage() {
  const session = useSession()

  const stripePortalUrl = session ? `/api/billing/portal?email=${encodeURIComponent(session.email)}` : '#'

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: T.linen, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        height: 56, padding: '0 20px', borderBottom: `1px solid ${T.rule}`,
        background: T.linen, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', serif", fontSize: 22, fontWeight: 500, color: T.esp }}>
          Body<em style={{ color: T.brown, fontWeight: 400 }}>forme</em>
        </div>
        <div style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', serif", fontSize: 20, fontStyle: 'italic', color: T.esp }}>Membership</div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 20 }}>

        {/* Dark plan card */}
        <div style={{ margin: '20px 20px 0', background: T.esp, padding: '28px 24px 24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 6px)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{
              fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 9.5, fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,0.4)',
            }}>Your membership</div>
            <div style={{ fontFamily: "'Cormorant Garamond', 'Times New Roman', serif", fontSize: 34, color: T.linen, marginTop: 8, lineHeight: 1, fontStyle: 'italic' }}>
              Active <em style={{ color: T.sand }}>member</em>
            </div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 13, color: 'rgba(244,237,225,0.65)', marginTop: 10 }}>
              Hi {session.firstName} — your membership is active.
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '22px 0 18px' }} />

            <div style={{ display: 'flex', gap: 8 }}>
              <a
                href="https://www.bodyforme.com.au/book-online"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, padding: '12px 0', background: T.brown,
                  textAlign: 'center',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: T.linen, textDecoration: 'none',
                }}
              >
                Book a class
              </a>
              <a
                href={stripePortalUrl}
                style={{
                  flex: 1, padding: '12px 0',
                  border: '1px solid rgba(255,255,255,0.25)',
                  textAlign: 'center',
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'rgba(244,237,225,0.8)', textDecoration: 'none',
                }}
              >
                Manage billing
              </a>
            </div>
          </div>
        </div>

        {/* Plan actions */}
        <div style={{ margin: '20px 20px 0' }}>
          <div style={{
            fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 9.5, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10,
          }}>Plan</div>
          <div style={{ background: T.canvas, border: `1px solid ${T.rule}` }}>
            <ActionRow
              icon={<><path d="M3 8h10M9 4l4 4-4 4" stroke={T.esp} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>}
              label="Change plan"
              sub="Upgrade, downgrade, or switch billing"
            />
            <ActionRow
              icon={<><rect x="4" y="3" width="2" height="10" fill={T.esp}/><rect x="10" y="3" width="2" height="10" fill={T.esp}/></>}
              label="Pause membership"
              sub="Contact us to arrange a pause"
            />
            <ActionRow
              icon={<><path d="M4 4l8 8M12 4l-8 8" stroke={T.rust} strokeWidth="1.4" strokeLinecap="round"/></>}
              label="Cancel membership"
              danger
              last
            />
          </div>
        </div>

        {/* Billing */}
        <div style={{ margin: '24px 20px 0' }}>
          <div style={{
            fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 9.5, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase', color: T.muted, marginBottom: 10,
          }}>Billing</div>
          <div style={{ background: T.canvas, border: `1px solid ${T.rule}` }}>
            <ActionRow
              icon={<><rect x="2" y="4" width="12" height="9" stroke={T.esp} strokeWidth="1.2" fill="none"/><path d="M2 7h12M5 10h2" stroke={T.esp} strokeWidth="1.2"/></>}
              label="Payment methods"
              sub="Update card or bank details"
            />
            <ActionRow
              icon={<><rect x="3" y="3" width="10" height="10" stroke={T.esp} strokeWidth="1.2" fill="none"/><path d="M5 6h6M5 9h4" stroke={T.esp} strokeWidth="1.2"/></>}
              label="Invoices & receipts"
              sub="Download past invoices"
              last
            />
          </div>
          <p style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: T.muted, marginTop: 10, lineHeight: 1.6 }}>
            Billing is managed securely via Stripe. Tap any item above to open your billing portal.
          </p>
        </div>

        {/* Referral */}
        <div style={{
          margin: '20px 20px 0', padding: '16px 18px',
          border: `1px dashed ${T.rule}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 32, height: 32, border: `1px solid ${T.brown}`, color: T.brown,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cormorant Garamond', 'Times New Roman', serif", fontSize: 16, fontStyle: 'italic',
          }}>%</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 500, color: T.esp }}>Refer a friend, get 2 weeks free</div>
            <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 11, color: T.muted, marginTop: 2 }}>Ask at the studio for your referral code</div>
          </div>
        </div>

      </div>
    </div>
  )
}
