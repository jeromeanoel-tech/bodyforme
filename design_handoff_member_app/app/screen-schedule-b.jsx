// Bodyforme Member App — Schedule variant B: Agenda card stack

const { Lbl, StatusBar, TabBar, AppHeader, Brand, ClassDot } = window.BF;
const BFP = window.BFP;
const body = window.BF.body;
const display = window.BF.display;

function AgendaCard({ c }) {
  const full = c.spots === 0;
  return (
    <div style={{
      background: c.booked ? BFP.esp : BFP.canvas,
      color: c.booked ? BFP.linen : BFP.text,
      border: `1px solid ${c.booked ? BFP.esp : BFP.rule}`,
      padding: '20px 22px',
      marginBottom: 10,
      display: 'flex', gap: 16, alignItems: 'stretch',
      opacity: full ? 0.55 : 1,
    }}>
      <div style={{
        width: 76, flexShrink: 0,
        borderRight: `1px solid ${c.booked ? 'rgba(255,255,255,0.1)' : BFP.rule}`,
        paddingRight: 16,
      }}>
        <div style={{ fontFamily: display, fontSize: 28, lineHeight: 1, color: c.booked ? BFP.linen : BFP.text }}>{c.time}</div>
        <div style={{ fontFamily: body, fontSize: 10, color: c.booked ? 'rgba(244,237,225,0.5)' : BFP.muted, marginTop: 6, letterSpacing: '0.04em' }}>{c.dur}</div>
        {c.heat && <div style={{ fontFamily: body, fontSize: 10, color: c.booked ? BFP.sand : BFP.brown, marginTop: 8, fontWeight: 500 }}>{c.heat}</div>}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ClassDot type={c.type} size={6} />
          <div style={{ fontFamily: body, fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: c.booked ? 'rgba(244,237,225,0.55)' : BFP.muted }}>{c.type}</div>
        </div>
        <div style={{ fontFamily: display, fontSize: 22, fontStyle: 'italic', marginTop: 4, lineHeight: 1.1 }}>{c.name}</div>
        <div style={{ fontFamily: body, fontSize: 12, color: c.booked ? 'rgba(244,237,225,0.6)' : BFP.mid, marginTop: 6 }}>w/ {c.teacher}</div>

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {c.booked ? (
            <div style={{ fontFamily: body, fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: BFP.sand }}>✓ Booked</div>
          ) : full ? (
            <div style={{ fontFamily: body, fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: BFP.muted }}>Waitlist · 3 ahead</div>
          ) : (
            <div style={{ fontFamily: body, fontSize: 11, color: c.spots <= 3 ? BFP.rust : BFP.mid }}>{c.spots} spots left</div>
          )}
          <div style={{
            padding: '7px 14px',
            border: `1px solid ${c.booked ? 'rgba(244,237,225,0.3)' : BFP.text}`,
            color: c.booked ? BFP.linen : BFP.text,
            fontFamily: body, fontSize: 9.5, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>{c.booked ? 'Manage' : full ? 'Join list' : 'Book'}</div>
        </div>
      </div>
    </div>
  );
}

function ScheduleVariantBScreen() {
  const day = [
    { time: '6:00', dur: '90 min', name: 'Bikram Beginners', teacher: 'Anna L.', spots: 4, type: 'Bikram', heat: '40°C' },
    { time: '9:30', dur: '90 min', name: 'Bikram 90', teacher: 'James T.', spots: 8, type: 'Bikram', heat: '40°C', booked: true },
    { time: '12:15', dur: '45 min', name: 'Express Sculpt', teacher: 'Mia K.', spots: 12, type: 'Sculpt', heat: '32°C' },
    { time: '17:30', dur: '75 min', name: 'Yin & Restore', teacher: 'Sara P.', spots: 0, type: 'Yin' },
    { time: '20:00', dur: '90 min', name: 'Bikram 90', teacher: 'James T.', spots: 14, type: 'Bikram', heat: '40°C' },
  ];

  return (
    <div style={{ height: '100%', background: BFP.l2, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <AppHeader title="Today" leading={<Brand size={18} />}
        trailing={<svg width="18" height="18" viewBox="0 0 18 18"><rect x="2" y="3" width="14" height="13" stroke={BFP.text} strokeWidth="1.4" fill="none"/><path d="M2 7h14M6 1v4M12 1v4" stroke={BFP.text} strokeWidth="1.4" strokeLinecap="round"/></svg>}
      />

      {/* Big date hero */}
      <div style={{ padding: '24px 22px 18px' }}>
        <div style={{ fontFamily: body, fontSize: 9.5, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: BFP.muted }}>Wednesday</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 4 }}>
          <div style={{ fontFamily: display, fontSize: 64, lineHeight: 1, color: BFP.text }}>6</div>
          <div style={{ fontFamily: display, fontSize: 28, fontStyle: 'italic', color: BFP.brown }}>March</div>
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: body, fontSize: 12, color: BFP.mid }}>5 classes · 1 booked</div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 32, height: 32, border: `1px solid ${BFP.rule}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="8" height="12" viewBox="0 0 8 12"><path d="M6 1L2 6l4 5" stroke={BFP.text} strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>
            </div>
            <div style={{ width: 32, height: 32, background: BFP.esp, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="8" height="12" viewBox="0 0 8 12"><path d="M2 1l4 5-4 5" stroke={BFP.linen} strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 100px' }}>
        {day.map((c, i) => <AgendaCard key={i} c={c} />)}
      </div>

      <TabBar active="schedule" />
    </div>
  );
}

window.ScheduleVariantBScreen = ScheduleVariantBScreen;
