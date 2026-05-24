// Bodyforme Member App — Screen F: Payment methods (Stripe)

const { Lbl, StatusBar, CTA } = window.BF;
const BFP = window.BFP;
const body = window.BF.body;
const display = window.BF.display;

function CardBrand({ brand }) {
  if (brand === 'visa') return <div style={{ width: 38, height: 26, background: '#1a1f71', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: body, fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', fontStyle: 'italic' }}>VISA</div>;
  if (brand === 'mc') return <div style={{ width: 38, height: 26, background: BFP.l3, position: 'relative' }}>
    <div style={{ position: 'absolute', left: 6, top: 5, width: 16, height: 16, borderRadius: '50%', background: '#eb001b' }} />
    <div style={{ position: 'absolute', right: 6, top: 5, width: 16, height: 16, borderRadius: '50%', background: '#f79e1b', mixBlendMode: 'multiply' }} />
  </div>;
  return null;
}

function PMRow({ brand, last4, exp, def, holder }) {
  return (
    <div style={{
      padding: '18px 20px',
      borderBottom: `1px solid ${BFP.rule}`,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <CardBrand brand={brand} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontFamily: body, fontSize: 13, color: BFP.text, fontWeight: 500 }}>•••• {last4}</div>
          {def && (
            <div style={{
              fontFamily: body, fontSize: 8.5, fontWeight: 500,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: BFP.brown, padding: '2px 6px',
              border: `1px solid ${BFP.brown}`,
            }}>Default</div>
          )}
        </div>
        <div style={{ fontFamily: body, fontSize: 11, color: BFP.muted, marginTop: 3 }}>
          {holder} · Exp {exp}
        </div>
      </div>
      <svg width="14" height="4" viewBox="0 0 14 4"><circle cx="2" cy="2" r="1.5" fill={BFP.muted}/><circle cx="7" cy="2" r="1.5" fill={BFP.muted}/><circle cx="12" cy="2" r="1.5" fill={BFP.muted}/></svg>
    </div>
  );
}

function PaymentMethodsScreen() {
  return (
    <div style={{ height: '100%', background: BFP.linen, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      <div style={{ height: 56, padding: '0 20px', borderBottom: `1px solid ${BFP.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 1L3 7l6 6" stroke={BFP.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        <div style={{ fontFamily: display, fontSize: 22, fontStyle: 'italic', color: BFP.text }}>Payment</div>
        <div style={{ width: 14 }} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 0 130px' }}>

        {/* Stripe trust note */}
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="11" height="13" viewBox="0 0 11 13" fill="none"><path d="M5.5 0.5L1 2.5v4c0 3 2 5 4.5 6 2.5-1 4.5-3 4.5-6v-4l-4.5-2z" stroke={BFP.muted} strokeWidth="1.2" fill="none" strokeLinejoin="round"/></svg>
          <div style={{ fontFamily: body, fontSize: 11, color: BFP.muted, lineHeight: 1.5 }}>Secured by Stripe · we never store your card details</div>
        </div>

        <div style={{ padding: '0 20px' }}>
          <Lbl>Cards on file</Lbl>
        </div>

        <div style={{ marginTop: 10, background: BFP.canvas, borderTop: `1px solid ${BFP.rule}`, borderBottom: `1px solid ${BFP.rule}` }}>
          <PMRow brand="visa" last4="4242" exp="08/27" holder="Ava Hartley" def />
          <PMRow brand="mc" last4="1158" exp="11/26" holder="Ava Hartley" />
        </div>

        {/* Add new card form */}
        <div style={{ padding: '28px 20px 0' }}>
          <Lbl>Add new card</Lbl>
          <div style={{ marginTop: 16 }}>
            {/* Card number */}
            <div style={{ borderBottom: `1px solid ${BFP.rule}`, paddingBottom: 10, marginBottom: 18 }}>
              <Lbl>Card number</Lbl>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                <div style={{ fontFamily: body, fontSize: 16, color: BFP.text, letterSpacing: '0.06em' }}>1234 5678 9012 3456</div>
                <svg width="20" height="14" viewBox="0 0 20 14"><rect x="0" y="0" width="20" height="14" rx="1" fill={BFP.l3}/><path d="M0 4h20" stroke={BFP.muted} strokeWidth="0.8"/></svg>
              </div>
            </div>

            {/* Two columns: expiry + CVC */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
              <div style={{ borderBottom: `1px solid ${BFP.rule}`, paddingBottom: 10 }}>
                <Lbl>Expires</Lbl>
                <div style={{ fontFamily: body, fontSize: 16, color: BFP.text, marginTop: 6 }}>MM / YY</div>
              </div>
              <div style={{ borderBottom: `1px solid ${BFP.rule}`, paddingBottom: 10 }}>
                <Lbl>CVC</Lbl>
                <div style={{ fontFamily: body, fontSize: 16, color: BFP.muted, marginTop: 6 }}>•••</div>
              </div>
            </div>

            {/* Name */}
            <div style={{ borderBottom: `1px solid ${BFP.rule}`, paddingBottom: 10, marginBottom: 18 }}>
              <Lbl>Name on card</Lbl>
              <div style={{ fontFamily: body, fontSize: 16, color: BFP.text, marginTop: 6 }}>Ava Hartley</div>
            </div>

            {/* Set as default */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0' }}>
              <div style={{ width: 22, height: 22, borderRadius: 4, background: BFP.brown, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-5" stroke={BFP.canvas} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontFamily: body, fontSize: 13, color: BFP.text }}>Set as default payment method</div>
            </div>
          </div>
        </div>

        {/* Apple Pay row */}
        <div style={{ padding: '24px 20px 0' }}>
          <Lbl>Or pay with</Lbl>
          <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, padding: '14px 0', background: BFP.text, color: BFP.canvas, textAlign: 'center', fontFamily: body, fontSize: 13, fontWeight: 500 }}> Pay</div>
            <div style={{ flex: 1, padding: '14px 0', border: `1px solid ${BFP.text}`, color: BFP.text, textAlign: 'center', fontFamily: body, fontSize: 13, fontWeight: 500 }}>G Pay</div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px 20px 32px', background: BFP.linen, borderTop: `1px solid ${BFP.rule}` }}>
        <CTA>Save card</CTA>
      </div>
    </div>
  );
}

window.PaymentMethodsScreen = PaymentMethodsScreen;
