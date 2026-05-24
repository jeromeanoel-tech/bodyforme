// Bodyforme Member App — Screen D: Membership home

const { Lbl, StatusBar, TabBar, AppHeader, Brand, CTA } = window.BF;
const BFP = window.BFP;
const body = window.BF.body;
const display = window.BF.display;

function MetaRow({ k, v, last }) {
  return (
    <div style={{
      padding: '14px 0',
      borderBottom: last ? 'none' : `1px solid ${BFP.rule}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ fontFamily: body, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: BFP.muted }}>{k}</div>
      <div style={{ fontFamily: body, fontSize: 13, color: BFP.text }}>{v}</div>
    </div>
  );
}

function ActionRow({ icon, label, sub, danger, last }) {
  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: last ? 'none' : `1px solid ${BFP.rule}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ width: 32, height: 32, border: `1px solid ${BFP.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">{icon}</svg>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: body, fontSize: 13, fontWeight: 500, color: danger ? BFP.rust : BFP.text }}>{label}</div>
        {sub && <div style={{ fontFamily: body, fontSize: 11, color: BFP.muted, marginTop: 2 }}>{sub}</div>}
      </div>
      <svg width="6" height="11" viewBox="0 0 6 11" fill="none"><path d="M1 1l4 4.5L1 10" stroke={BFP.muted} strokeWidth="1.4" strokeLinecap="round"/></svg>
    </div>
  );
}

function MembershipScreen() {
  return (
    <div style={{ height: '100%', background: BFP.linen, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <AppHeader title="Membership" leading={<Brand size={18} />} />

      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 100 }}>
        {/* Plan card — featured dark */}
        <div style={{ margin: '20px 20px 0', background: BFP.esp, padding: '28px 24px 24px', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle grain */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 6px)' }} />
          <div style={{ position: 'relative' }}>
            <Lbl color="rgba(244,237,225,0.4)">Current plan</Lbl>
            <div style={{ fontFamily: display, fontSize: 38, color: BFP.linen, marginTop: 8, lineHeight: 1, fontStyle: 'italic' }}>
              <em style={{ color: BFP.sand }}>Immersion</em>
            </div>
            <div style={{ fontFamily: body, fontSize: 13, color: 'rgba(244,237,225,0.65)', marginTop: 10 }}>Unlimited classes · 7 days a week</div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 22 }}>
              <div style={{ fontFamily: display, fontSize: 44, color: BFP.linen, lineHeight: 1 }}>$59</div>
              <div style={{ fontFamily: body, fontSize: 12, color: 'rgba(244,237,225,0.6)' }}>/ week</div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.12)', margin: '22px 0 18px' }} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div>
                <Lbl color="rgba(244,237,225,0.4)">Renews</Lbl>
                <div style={{ fontFamily: body, fontSize: 13, color: BFP.linen, marginTop: 4 }}>Mon, 11 Mar</div>
              </div>
              <div>
                <Lbl color="rgba(244,237,225,0.4)">Member since</Lbl>
                <div style={{ fontFamily: body, fontSize: 13, color: BFP.linen, marginTop: 4 }}>Jul 2024</div>
              </div>
            </div>
          </div>
        </div>

        {/* Manage plan */}
        <div style={{ margin: '20px 20px 0' }}>
          <Lbl>Plan</Lbl>
          <div style={{ marginTop: 10, background: BFP.canvas, border: `1px solid ${BFP.rule}` }}>
            <ActionRow
              icon={<><path d="M3 8h10M9 4l4 4-4 4" stroke={BFP.text} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></>}
              label="Change plan"
              sub="Upgrade, downgrade, or switch billing"
            />
            <ActionRow
              icon={<><rect x="4" y="3" width="2" height="10" fill={BFP.text}/><rect x="10" y="3" width="2" height="10" fill={BFP.text}/></>}
              label="Pause membership"
              sub="Up to 4 weeks per year"
            />
            <ActionRow
              icon={<><path d="M4 4l8 8M12 4l-8 8" stroke={BFP.rust} strokeWidth="1.4" strokeLinecap="round"/></>}
              label="Cancel membership"
              danger
              last
            />
          </div>
        </div>

        {/* Billing */}
        <div style={{ margin: '24px 20px 0' }}>
          <Lbl>Billing</Lbl>
          <div style={{ marginTop: 10, background: BFP.canvas, border: `1px solid ${BFP.rule}` }}>
            {/* Card row */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${BFP.rule}`, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 38, height: 26, background: BFP.esp, color: BFP.linen, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: body, fontSize: 8, letterSpacing: '0.1em', fontWeight: 600 }}>VISA</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: body, fontSize: 13, color: BFP.text }}>Visa ending 4242</div>
                <div style={{ fontFamily: body, fontSize: 11, color: BFP.muted, marginTop: 2 }}>Expires 08/27 · Default</div>
              </div>
              <div style={{ fontFamily: body, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: BFP.brown }}>Manage</div>
            </div>
            <ActionRow
              icon={<><rect x="2" y="4" width="12" height="9" stroke={BFP.text} strokeWidth="1.2" fill="none"/><path d="M2 7h12M5 10h2" stroke={BFP.text} strokeWidth="1.2"/></>}
              label="Payment methods"
              sub="2 cards on file"
            />
            <ActionRow
              icon={<><rect x="3" y="3" width="10" height="10" stroke={BFP.text} strokeWidth="1.2" fill="none"/><path d="M5 6h6M5 9h4" stroke={BFP.text} strokeWidth="1.2"/></>}
              label="Invoices & receipts"
              sub="Last billed $236 · 4 Mar"
              last
            />
          </div>
        </div>

        {/* Promo */}
        <div style={{ margin: '24px 20px 0', padding: '16px 18px', border: `1px dashed ${BFP.rule}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, border: `1px solid ${BFP.brown}`, color: BFP.brown, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontSize: 16, fontStyle: 'italic' }}>%</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: body, fontSize: 12, fontWeight: 500, color: BFP.text }}>Refer a friend, get 2 weeks free</div>
            <div style={{ fontFamily: body, fontSize: 11, color: BFP.muted, marginTop: 2 }}>Your code: BODY-MEL-AVA</div>
          </div>
          <div style={{ fontFamily: body, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: BFP.brown }}>Share</div>
        </div>
      </div>

      <TabBar active="membership" />
    </div>
  );
}

window.MembershipScreen = MembershipScreen;
