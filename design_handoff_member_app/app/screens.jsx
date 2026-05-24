// Bodyforme Member App — Screens
// All screens are 402×874 iOS frames using IOSDevice from ios-frame.jsx
// Palette is exposed via window.BFP

const BFP = {
  linen:   '#f4ede1',
  l2:      '#ede4d4',
  l3:      '#e4d8c6',
  esp:     '#2a1506',
  esp2:    '#3d2210',
  brown:   '#7a4a2a',
  blt:     '#a0724e',
  sand:    '#c4a882',
  text:    '#2a1506',
  mid:     '#6b4e36',
  muted:   '#a08568',
  rule:    '#d8ccba',
  ruleD:   'rgba(255,255,255,0.10)',
  canvas:  '#fdfaf6',
  rust:    '#9a5a3a',
  sage:    '#7a9478',
  blue:    '#8a9ab0',
  amber:   '#b0906a',
};
window.BFP = BFP;

// ─────────────────────────────────────────────────────────────
// Shared bits
// ─────────────────────────────────────────────────────────────

const display = "'Cormorant Garamond', 'Times New Roman', serif";
const body    = "'DM Sans', -apple-system, system-ui, sans-serif";

function Lbl({ children, mt = 0, color = BFP.muted }) {
  return (
    <div style={{
      fontFamily: body, fontSize: 9.5, fontWeight: 500,
      letterSpacing: '0.18em', textTransform: 'uppercase',
      color, marginTop: mt,
    }}>{children}</div>
  );
}

function H1({ children, color = BFP.text, italic = false, size = 30 }) {
  return (
    <div style={{
      fontFamily: display, fontSize: size, fontWeight: 400,
      lineHeight: 1.05, color, letterSpacing: '-0.005em',
      fontStyle: italic ? 'italic' : 'normal',
    }}>{children}</div>
  );
}

function Body({ children, color = BFP.mid, size = 13, mt = 0 }) {
  return (
    <div style={{
      fontFamily: body, fontSize: size, fontWeight: 300,
      lineHeight: 1.55, color, marginTop: mt,
    }}>{children}</div>
  );
}

// Brand wordmark
function Brand({ color = BFP.text, size = 22 }) {
  return (
    <span style={{
      fontFamily: display, fontSize: size, fontWeight: 500,
      letterSpacing: '-0.01em', color,
    }}>Body<em style={{ color: BFP.brown, fontWeight: 400 }}>forme</em></span>
  );
}

// Status bar (compact, dark/light)
function StatusBar({ dark = false }) {
  const c = dark ? '#fff' : BFP.text;
  return (
    <div style={{
      height: 50, display: 'flex', alignItems: 'flex-end',
      justifyContent: 'space-between', padding: '0 28px 8px',
      fontFamily: body, fontSize: 14, fontWeight: 600, color: c,
    }}>
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.5" fill={c}/><rect x="4.5" y="5" width="3" height="6" rx="0.5" fill={c}/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill={c}/><rect x="13.5" y="0" width="3" height="11" rx="0.5" fill={c}/></svg>
        <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="20" height="10" rx="2.5" stroke={c} strokeOpacity="0.5" fill="none"/><rect x="2" y="2" width="17" height="7" rx="1.5" fill={c}/><path d="M22 3.5v4c0.7-0.3 1.2-1 1.2-2s-0.5-1.7-1.2-2z" fill={c} fillOpacity="0.5"/></svg>
      </div>
    </div>
  );
}

// Bottom tab bar — 4 tabs
function TabBar({ active = 'schedule', dark = false }) {
  const tabs = [
    { id: 'schedule',  label: 'Schedule', icon: <path d="M3 4h14v12H3V4zm3-2v3M14 2v3M3 8h14" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/> },
    { id: 'bookings',  label: 'Bookings', icon: <path d="M4 3h12v14l-6-3-6 3V3z" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinejoin="round"/> },
    { id: 'membership', label: 'Membership', icon: <><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></> },
    { id: 'profile',   label: 'Profile', icon: <><circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.4" fill="none"/><path d="M3 17c1-3.5 4-5 7-5s6 1.5 7 5" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/></> },
  ];
  const bg = dark ? BFP.esp : BFP.linen;
  const border = dark ? BFP.ruleD : BFP.rule;
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      background: bg, borderTop: `1px solid ${border}`,
      paddingTop: 10, paddingBottom: 28,
      display: 'flex', justifyContent: 'space-around',
    }}>
      {tabs.map(t => {
        const on = t.id === active;
        const color = on ? (dark ? BFP.sand : BFP.brown) : (dark ? 'rgba(244,237,225,0.45)' : BFP.muted);
        return (
          <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color, flex: 1 }}>
            <svg width="20" height="20" viewBox="0 0 20 20">{t.icon}</svg>
            <div style={{
              fontFamily: body, fontSize: 9, fontWeight: 500,
              letterSpacing: '0.14em', textTransform: 'uppercase',
            }}>{t.label}</div>
          </div>
        );
      })}
    </div>
  );
}

// App header (linen, 56px)
function AppHeader({ title, leading, trailing, dark = false }) {
  const bg = dark ? BFP.esp : BFP.linen;
  const text = dark ? BFP.linen : BFP.text;
  const border = dark ? BFP.ruleD : BFP.rule;
  return (
    <div style={{
      height: 56, padding: '0 20px',
      borderBottom: `1px solid ${border}`,
      background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ width: 28, display: 'flex', alignItems: 'center' }}>{leading}</div>
      <div style={{ fontFamily: display, fontSize: 22, fontWeight: 500, color: text, fontStyle: 'italic' }}>{title}</div>
      <div style={{ width: 28, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>{trailing}</div>
    </div>
  );
}

// Filled dark CTA
function CTA({ children, full = true, dark = true, small = false }) {
  return (
    <div style={{
      background: dark ? BFP.esp : BFP.canvas,
      color: dark ? BFP.canvas : BFP.esp,
      border: dark ? 'none' : `1px solid ${BFP.esp}`,
      padding: small ? '10px 18px' : '14px 22px',
      textAlign: 'center',
      fontFamily: body, fontSize: small ? 10 : 11, fontWeight: 500,
      letterSpacing: '0.14em', textTransform: 'uppercase',
      width: full ? '100%' : 'auto',
      borderRadius: 4,
    }}>{children}</div>
  );
}

// Icon for class type — colored dot/chip
function ClassDot({ type, size = 8 }) {
  const colors = { Bikram: BFP.rust, Pilates: BFP.sage, Sculpt: BFP.blue, Special: BFP.amber, Yin: '#8a7da0' };
  return <span style={{ width: size, height: size, borderRadius: '50%', background: colors[type] || BFP.muted, display: 'inline-block' }} />;
}

// Subtle divider used inside cards
function Rule({ color, mt = 0, mb = 0 }) {
  return <div style={{ height: 1, background: color || BFP.rule, marginTop: mt, marginBottom: mb }} />;
}

window.BF = { Lbl, H1, Body, Brand, StatusBar, TabBar, AppHeader, CTA, ClassDot, Rule, display, body };
