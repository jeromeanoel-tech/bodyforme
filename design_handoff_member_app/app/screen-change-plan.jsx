// Bodyforme Member App — Screen E: Change plan

const { Lbl, StatusBar, CTA, Brand } = window.BF;
const BFP = window.BFP;
const body = window.BF.body;
const display = window.BF.display;

function PlanCard({ name, price, per, features, current, selected, popular }) {
  const dark = selected;
  return (
    <div style={{
      border: `1px solid ${selected ? BFP.esp : BFP.rule}`,
      background: dark ? BFP.esp : BFP.canvas,
      padding: '22px 22px 20px',
      marginBottom: 12,
      position: 'relative',
    }}>
      {popular && (
        <div style={{
          position: 'absolute', top: -1, right: -1,
          background: BFP.blt, color: BFP.canvas,
          padding: '4px 10px',
          fontFamily: body, fontSize: 8.5, fontWeight: 500,
          letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>Most popular</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: body, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: dark ? 'rgba(244,237,225,0.5)' : BFP.muted }}>
            {current ? 'Your plan' : 'Plan'}
          </div>
          <div style={{ fontFamily: display, fontSize: 26, color: dark ? BFP.linen : BFP.text, fontStyle: 'italic', marginTop: 4 }}>{name}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: display, fontSize: 30, color: dark ? BFP.linen : BFP.text, lineHeight: 1 }}>{price}</div>
          <div style={{ fontFamily: body, fontSize: 11, color: dark ? 'rgba(244,237,225,0.55)' : BFP.muted, marginTop: 4 }}>{per}</div>
        </div>
      </div>
      <div style={{ height: 1, background: dark ? 'rgba(255,255,255,0.12)' : BFP.rule, margin: '18px 0 14px' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {features.map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <svg width="11" height="11" viewBox="0 0 11 11" style={{ marginTop: 4, flexShrink: 0 }} fill="none">
              <path d="M2 5.5l2.5 2L9 3" stroke={dark ? BFP.sand : BFP.brown} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ fontFamily: body, fontSize: 12.5, color: dark ? 'rgba(244,237,225,0.85)' : BFP.mid, lineHeight: 1.5 }}>{f}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangePlanScreen() {
  return (
    <div style={{ height: '100%', background: BFP.linen, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      {/* Header with back */}
      <div style={{ height: 56, padding: '0 20px', borderBottom: `1px solid ${BFP.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 1L3 7l6 6" stroke={BFP.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div style={{ fontFamily: display, fontSize: 22, fontStyle: 'italic', color: BFP.text }}>Change plan</div>
        <div style={{ width: 36 }} />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px 130px' }}>
        <div style={{ marginBottom: 18 }}>
          <Lbl>3 plans</Lbl>
          <div style={{ fontFamily: display, fontSize: 24, color: BFP.text, marginTop: 6, lineHeight: 1.2 }}>
            Find the rhythm <em style={{ color: BFP.brown }}>that fits</em>
          </div>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', border: `1px solid ${BFP.rule}`, marginBottom: 18 }}>
          {['Weekly', 'Fortnightly', 'Annual'].map((t, i) => (
            <div key={t} style={{
              flex: 1, padding: '10px 0', textAlign: 'center',
              background: i === 0 ? BFP.esp : 'transparent',
              color: i === 0 ? BFP.linen : BFP.muted,
              fontFamily: body, fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>{t}{i === 2 && ' · save 12%'}</div>
          ))}
        </div>

        <PlanCard
          name="Foundation"
          price="$39"
          per="per week"
          features={['4 classes per week', 'Bikram or Pilates', 'Free guest pass quarterly']}
        />
        <PlanCard
          name="Immersion"
          price="$59"
          per="per week"
          features={['Unlimited classes', 'All studios, all formats', 'Mat & towel hire included', '2 guest passes / month']}
          current
          selected
          popular
        />
        <PlanCard
          name="Casual"
          price="$32"
          per="per class"
          features={['Pay as you go', 'No commitment', 'Valid 12 months from purchase']}
        />

        {/* Change summary */}
        <div style={{ marginTop: 18, padding: '14px 16px', background: BFP.l2, border: `1px solid ${BFP.rule}` }}>
          <div style={{ fontFamily: body, fontSize: 11, color: BFP.mid, lineHeight: 1.6 }}>
            Changes apply on your next billing date <strong style={{ color: BFP.text, fontWeight: 500 }}>11 March 2025</strong>. You&apos;ll keep all current benefits until then.
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '16px 20px 32px', background: BFP.linen, borderTop: `1px solid ${BFP.rule}` }}>
        <CTA>Stay on Immersion</CTA>
      </div>
    </div>
  );
}

window.ChangePlanScreen = ChangePlanScreen;
