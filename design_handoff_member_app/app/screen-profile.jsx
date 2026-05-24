// Bodyforme Member App — Profile + auxiliary screens

const { Lbl, StatusBar, TabBar, AppHeader, Brand, ClassDot } = window.BF;
const BFP = window.BFP;
const body = window.BF.body;
const display = window.BF.display;

function NavRow({ label, sub, last }) {
  return (
    <div style={{
      padding: '16px 20px',
      borderBottom: last ? 'none' : `1px solid ${BFP.rule}`,
      display: 'flex', alignItems: 'center',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: body, fontSize: 13, color: BFP.text }}>{label}</div>
        {sub && <div style={{ fontFamily: body, fontSize: 11, color: BFP.muted, marginTop: 3 }}>{sub}</div>}
      </div>
      <svg width="6" height="11" viewBox="0 0 6 11"><path d="M1 1l4 4.5L1 10" stroke={BFP.muted} strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>
    </div>
  );
}

function ProfileScreen() {
  return (
    <div style={{ height: '100%', background: BFP.linen, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <AppHeader title="Profile" leading={<Brand size={18} />} />

      <div style={{ flex: 1, overflow: 'auto', paddingBottom: 100 }}>
        {/* Hero */}
        <div style={{ padding: '32px 24px 28px', textAlign: 'center', borderBottom: `1px solid ${BFP.rule}` }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: BFP.l3, margin: '0 auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: display, fontSize: 32, color: BFP.brown, fontStyle: 'italic',
          }}>AH</div>
          <div style={{ fontFamily: display, fontSize: 26, fontStyle: 'italic', color: BFP.text, marginTop: 14 }}>Ava Hartley</div>
          <div style={{ fontFamily: body, fontSize: 12, color: BFP.muted, marginTop: 4 }}>ava.h@email.com · member since Jul 2024</div>
          <div style={{
            display: 'inline-block', marginTop: 14,
            padding: '6px 12px', background: BFP.esp, color: BFP.sand,
            fontFamily: body, fontSize: 9, fontWeight: 500,
            letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>Immersion · 8-week streak</div>
        </div>

        {/* Streak strip */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BFP.rule}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <Lbl>This week</Lbl>
            <div style={{ fontFamily: body, fontSize: 11, color: BFP.brown }}>4 / 5 goal</div>
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between' }}>
            {[1, 1, 1, 0, 1, 0, 0].map((d, i) => (
              <div key={i} style={{ flex: 1, height: 36, background: d ? BFP.brown : BFP.l3, opacity: d ? 1 : 0.5 }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'space-between', marginTop: 6 }}>
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: body, fontSize: 9.5, color: BFP.muted, letterSpacing: '0.1em' }}>{d}</div>
            ))}
          </div>
        </div>

        {/* Account */}
        <div style={{ padding: '24px 0 0' }}>
          <div style={{ padding: '0 24px' }}><Lbl>Account</Lbl></div>
          <div style={{ marginTop: 10, background: BFP.canvas, borderTop: `1px solid ${BFP.rule}`, borderBottom: `1px solid ${BFP.rule}` }}>
            <NavRow label="Personal details" sub="Name, email, phone, emergency contact" />
            <NavRow label="Notifications" sub="Class reminders, waitlist, billing" />
            <NavRow label="Health & preferences" sub="Injuries, intensity, favourite teachers" last />
          </div>
        </div>

        {/* Studio */}
        <div style={{ padding: '24px 0 0' }}>
          <div style={{ padding: '0 24px' }}><Lbl>Studio</Lbl></div>
          <div style={{ marginTop: 10, background: BFP.canvas, borderTop: `1px solid ${BFP.rule}`, borderBottom: `1px solid ${BFP.rule}` }}>
            <NavRow label="Studio info" sub="Hours, location, parking" />
            <NavRow label="QR check-in" sub="Show at front desk" />
            <NavRow label="Refer a friend" sub="2 weeks free for both of you" last />
          </div>
        </div>

        {/* Support */}
        <div style={{ padding: '24px 0 0' }}>
          <div style={{ padding: '0 24px' }}><Lbl>Support</Lbl></div>
          <div style={{ marginTop: 10, background: BFP.canvas, borderTop: `1px solid ${BFP.rule}`, borderBottom: `1px solid ${BFP.rule}` }}>
            <NavRow label="Help centre" />
            <NavRow label="Terms & privacy" />
            <NavRow label="Sign out" last />
          </div>
        </div>

        <div style={{ padding: '32px 24px', textAlign: 'center', fontFamily: body, fontSize: 10, color: BFP.muted, letterSpacing: '0.04em' }}>
          Bodyforme · Collingwood<br/>v1.0.0
        </div>
      </div>

      <TabBar active="profile" />
    </div>
  );
}

window.ProfileScreen = ProfileScreen;
