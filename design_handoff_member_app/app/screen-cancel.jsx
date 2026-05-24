// Bodyforme Member App — Screen G: Cancel booking confirm sheet

const { Lbl, StatusBar, CTA } = window.BF;
const BFP = window.BFP;
const body = window.BF.body;
const display = window.BF.display;

function CancelBookingScreen() {
  return (
    <div style={{ height: '100%', background: BFP.esp, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      {/* Dimmed schedule "behind" — we show a sheet effect */}
      <StatusBar dark />
      <div style={{ flex: 1 }} />

      {/* Sheet */}
      <div style={{
        background: BFP.linen,
        borderRadius: '20px 20px 0 0',
        padding: '14px 24px 36px',
      }}>
        {/* drag handle */}
        <div style={{ width: 44, height: 4, background: BFP.rule, borderRadius: 2, margin: '0 auto 22px' }} />

        <Lbl>Cancel booking</Lbl>
        <div style={{ fontFamily: display, fontSize: 26, color: BFP.text, marginTop: 8, lineHeight: 1.2 }}>
          Cancel <em style={{ color: BFP.brown }}>Bikram 90</em> on Wednesday at 9:30 AM?
        </div>

        {/* Cutoff status */}
        <div style={{ marginTop: 22, padding: '14px 16px', background: BFP.canvas, border: `1px solid ${BFP.rule}`, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="9" cy="9" r="7.5" stroke={BFP.sage} strokeWidth="1.4" fill="none"/>
            <path d="M5 9l3 3 5-6" stroke={BFP.sage} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <div>
            <div style={{ fontFamily: body, fontSize: 12.5, fontWeight: 500, color: BFP.text }}>Free cancellation</div>
            <div style={{ fontFamily: body, fontSize: 11.5, color: BFP.mid, marginTop: 4, lineHeight: 1.5 }}>
              You&apos;re cancelling 28 hours before the class. Your credit will be returned to your plan.
            </div>
          </div>
        </div>

        {/* Reason */}
        <div style={{ marginTop: 18 }}>
          <Lbl>Tell us why (optional)</Lbl>
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Schedule conflict', 'Unwell', 'Travel', 'Switching class', 'Other'].map(r => (
              <div key={r} style={{
                padding: '8px 14px', border: `1px solid ${BFP.rule}`,
                fontFamily: body, fontSize: 11.5, color: BFP.mid, background: BFP.canvas,
              }}>{r}</div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <CTA>Confirm cancellation</CTA>
          <div style={{
            textAlign: 'center', padding: '14px 22px',
            fontFamily: body, fontSize: 11, fontWeight: 500,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: BFP.mid,
          }}>Keep booking</div>
        </div>
      </div>
    </div>
  );
}

window.CancelBookingScreen = CancelBookingScreen;
