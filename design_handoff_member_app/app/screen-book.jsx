// Bodyforme Member App — Screen B: Class detail / book sheet
// 402×874 — overlay sheet on dim'd schedule background

const { Lbl, H1, Body, StatusBar, CTA, ClassDot } = window.BF;
const BFP = window.BFP;
const body = window.BF.body;
const display = window.BF.display;

function DetailRow({ label, value, last }) {
  return (
    <div style={{
      padding: '14px 0',
      borderBottom: last ? 'none' : `1px solid ${BFP.rule}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <div style={{ fontFamily: body, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: BFP.muted }}>{label}</div>
      <div style={{ fontFamily: body, fontSize: 13, color: BFP.text, fontWeight: 400 }}>{value}</div>
    </div>
  );
}

function BookScreen() {
  return (
    <div style={{ height: '100%', background: BFP.linen, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />

      {/* Image header */}
      <div style={{
        height: 280, position: 'relative',
        background: `linear-gradient(180deg, rgba(42,21,6,0) 40%, rgba(42,21,6,0.55) 100%), linear-gradient(135deg, ${BFP.rust} 0%, ${BFP.esp} 100%)`,
      }}>
        {/* Texture lines */}
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.15 }} preserveAspectRatio="none">
          <defs>
            <pattern id="lines" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1="0" y1="0" x2="0" y2="8" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lines)"/>
        </svg>

        {/* Top controls */}
        <div style={{ position: 'absolute', top: 56, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(244,237,225,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 1L3 7l6 6" stroke={BFP.text} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(244,237,225,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 12.5C7 12.5 1.5 9 1.5 5A3 3 0 017 3.5 3 3 0 0112.5 5c0 4-5.5 7.5-5.5 7.5z" stroke={BFP.text} strokeWidth="1.4" strokeLinejoin="round" fill="none"/></svg>
          </div>
        </div>

        {/* Class title overlay */}
        <div style={{ position: 'absolute', bottom: 24, left: 24, right: 24, color: BFP.linen }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <ClassDot type="Bikram" size={6} />
            <div style={{ fontFamily: body, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(244,237,225,0.85)' }}>Bikram · 90 min · 40°C</div>
          </div>
          <div style={{ fontFamily: display, fontSize: 36, fontWeight: 400, lineHeight: 1.0 }}>
            Bikram <em style={{ color: BFP.sand }}>90</em>
          </div>
          <div style={{ fontFamily: body, fontSize: 13, color: 'rgba(244,237,225,0.7)', marginTop: 6 }}>Wednesday, 6 March · 9:30 AM</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px 130px' }}>
        {/* Teacher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 18, borderBottom: `1px solid ${BFP.rule}` }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: BFP.l3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontSize: 18, color: BFP.brown, fontStyle: 'italic' }}>JT</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: body, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: BFP.muted }}>Teacher</div>
            <div style={{ fontFamily: display, fontSize: 18, fontStyle: 'italic', color: BFP.text, marginTop: 2 }}>James Templeton</div>
          </div>
          <div style={{ fontFamily: body, fontSize: 10, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: BFP.brown }}>View →</div>
        </div>

        {/* About */}
        <div style={{ paddingTop: 18 }}>
          <Lbl>About this class</Lbl>
          <Body mt={8}>The classic 26 postures and two breathing exercises practised in 40°C heat. Detoxifies, strengthens and resets — suitable for all levels.</Body>
        </div>

        {/* Detail rows */}
        <div style={{ marginTop: 18 }}>
          <DetailRow label="Studio" value="Room 1 — Heated" />
          <DetailRow label="Spots left" value="8 of 24" />
          <DetailRow label="Cancellation" value="Free up to 4hrs prior" />
          <DetailRow label="Mat hire" value="$3 add-on" last />
        </div>

        {/* Add-on */}
        <div style={{
          marginTop: 18, border: `1px solid ${BFP.rule}`, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, background: BFP.canvas,
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 4, border: `1.5px solid ${BFP.brown}`,
            background: BFP.brown,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2 2 4-5" stroke={BFP.canvas} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: body, fontSize: 13, fontWeight: 500, color: BFP.text }}>Mat & towel hire</div>
            <div style={{ fontFamily: body, fontSize: 11, color: BFP.muted, marginTop: 2 }}>Save the schlep — we&apos;ll have it ready</div>
          </div>
          <div style={{ fontFamily: display, fontSize: 18, color: BFP.text }}>$3</div>
        </div>
      </div>

      {/* Sticky CTA bar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        padding: '16px 20px 32px', background: BFP.linen,
        borderTop: `1px solid ${BFP.rule}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div>
            <div style={{ fontFamily: body, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: BFP.muted }}>From plan</div>
            <div style={{ fontFamily: display, fontSize: 22, color: BFP.text, marginTop: 2 }}>1 credit + $3</div>
          </div>
          <div style={{ flex: 1 }}>
            <CTA>Confirm booking</CTA>
          </div>
        </div>
      </div>
    </div>
  );
}

window.BookScreen = BookScreen;
