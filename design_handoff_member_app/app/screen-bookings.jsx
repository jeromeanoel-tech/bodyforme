// Bodyforme Member App — Screen C: Bookings (upcoming + past)

const { Lbl, StatusBar, TabBar, AppHeader, Brand, ClassDot } = window.BF;
const BFP = window.BFP;
const body = window.BF.body;
const display = window.BF.display;

function BookingCard({ b, past }) {
  return (
    <div style={{
      background: past ? 'transparent' : BFP.canvas,
      border: `1px solid ${BFP.rule}`,
      padding: '18px 18px',
      marginBottom: 12,
      display: 'flex', gap: 14, alignItems: 'stretch',
      opacity: past ? 0.7 : 1,
    }}>
      {/* Date column */}
      <div style={{
        width: 56, flexShrink: 0,
        borderRight: `1px solid ${BFP.rule}`, paddingRight: 12,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: body, fontSize: 9, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: BFP.muted }}>{b.mon}</div>
        <div style={{ fontFamily: display, fontSize: 30, lineHeight: 1, color: BFP.text, marginTop: 2 }}>{b.day}</div>
        <div style={{ fontFamily: body, fontSize: 10, color: BFP.muted, marginTop: 4, letterSpacing: '0.04em' }}>{b.time}</div>
      </div>
      {/* Class */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <ClassDot type={b.type} size={6} />
          <div style={{ fontFamily: body, fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: BFP.muted }}>{b.type} · {b.dur}</div>
        </div>
        <div style={{ fontFamily: display, fontSize: 19, fontStyle: 'italic', color: BFP.text, marginTop: 4 }}>{b.name}</div>
        <div style={{ fontFamily: body, fontSize: 11, color: BFP.mid, marginTop: 4 }}>w/ {b.teacher}</div>
        {!past && b.cutoff && (
          <div style={{ marginTop: 10, padding: '6px 10px', background: BFP.l2, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" stroke={BFP.brown} strokeWidth="1" fill="none"/><path d="M5 2.5V5l1.5 1" stroke={BFP.brown} strokeWidth="1" strokeLinecap="round"/></svg>
            <span style={{ fontFamily: body, fontSize: 10, color: BFP.brown, letterSpacing: '0.06em' }}>Cancel by {b.cutoff}</span>
          </div>
        )}
        {past && (
          <div style={{ marginTop: 10, fontFamily: body, fontSize: 10, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: b.attended ? BFP.sage : BFP.muted }}>
            {b.attended ? '✓ Attended' : '— Missed'}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingsScreen() {
  const upcoming = [
    { mon: 'Wed', day: 6, time: '9:30 AM', type: 'Bikram', dur: '90 min', name: 'Bikram 90', teacher: 'James T.', cutoff: '5:30 AM' },
    { mon: 'Thu', day: 7, time: '5:30 PM', type: 'Yin', dur: '75 min', name: 'Yin & Restore', teacher: 'Sara P.', cutoff: '1:30 PM' },
    { mon: 'Sat', day: 9, time: '8:00 AM', type: 'Pilates', dur: '60 min', name: 'Reformer Pilates', teacher: 'Mia K.', cutoff: '4:00 AM' },
  ];
  const past = [
    { mon: 'Mon', day: 4, time: '6:00 AM', type: 'Bikram', dur: '90 min', name: 'Bikram Beginners', teacher: 'Anna L.', attended: true },
    { mon: 'Sun', day: 3, time: '10:00 AM', type: 'Sculpt', dur: '45 min', name: 'Express Sculpt', teacher: 'Mia K.', attended: true },
    { mon: 'Fri', day: 1, time: '6:30 PM', type: 'Pilates', dur: '60 min', name: 'Mat Pilates', teacher: 'Anna L.', attended: false },
  ];

  return (
    <div style={{ height: '100%', background: BFP.linen, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <AppHeader title="Bookings" leading={<Brand size={18} />} />

      {/* Stats strip */}
      <div style={{ padding: '20px 20px 4px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: BFP.rule, border: `1px solid ${BFP.rule}`, margin: '20px 20px 0' }}>
        {[
          { n: 12, l: 'This month' },
          { n: 47, l: 'This year' },
          { n: 8, l: 'Streak · weeks' },
        ].map(s => (
          <div key={s.l} style={{ background: BFP.canvas, padding: '14px 12px', textAlign: 'center' }}>
            <div style={{ fontFamily: display, fontSize: 26, color: BFP.text, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontFamily: body, fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: BFP.muted, marginTop: 6 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tab toggle */}
      <div style={{ display: 'flex', padding: '20px 20px 0', gap: 24, borderBottom: `1px solid ${BFP.rule}`, marginTop: 16 }}>
        {['Upcoming', 'Past'].map((t, i) => (
          <div key={t} style={{
            paddingBottom: 14,
            fontFamily: body, fontSize: 11, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: i === 0 ? BFP.text : BFP.muted,
            borderBottom: i === 0 ? `2px solid ${BFP.brown}` : 'none',
            marginBottom: -1,
          }}>{t}{i === 0 && ' · 3'}</div>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 100px' }}>
        {upcoming.map((b, i) => <BookingCard key={i} b={b} />)}

        <div style={{ marginTop: 24, marginBottom: 12 }}>
          <Lbl>Recent</Lbl>
        </div>
        {past.map((b, i) => <BookingCard key={i} b={b} past />)}
      </div>

      <TabBar active="bookings" />
    </div>
  );
}

window.BookingsScreen = BookingsScreen;
