// Bodyforme Member App — Screen A: Schedule (day-pill, list)
// 402×874

const { Lbl, H1, Body, Brand, StatusBar, TabBar, AppHeader, CTA, ClassDot, Rule } = window.BF;
const BFP = window.BFP;
const body = window.BF.body;
const display = window.BF.display;

// Sample classes for the selected day
const CLASSES = [
  { time: '6:00', dur: '90 min', name: 'Bikram Beginners', teacher: 'Anna L.', spots: 4, type: 'Bikram', heat: '40°C' },
  { time: '7:30', dur: '60 min', name: 'Reformer Pilates', teacher: 'Mia K.', spots: 0, type: 'Pilates', heat: null },
  { time: '9:30', dur: '90 min', name: 'Bikram 90', teacher: 'James T.', spots: 8, type: 'Bikram', heat: '40°C' },
  { time: '12:15', dur: '45 min', name: 'Express Sculpt', teacher: 'Mia K.', spots: 12, type: 'Sculpt', heat: '32°C' },
  { time: '17:30', dur: '75 min', name: 'Yin & Restore', teacher: 'Sara P.', spots: 2, type: 'Yin', heat: null, booked: true },
  { time: '18:45', dur: '60 min', name: 'Mat Pilates', teacher: 'Anna L.', spots: 6, type: 'Pilates', heat: null },
  { time: '20:00', dur: '90 min', name: 'Bikram 90', teacher: 'James T.', spots: 14, type: 'Bikram', heat: '40°C' },
];

function DayPill({ day, num, on, low, today }) {
  return (
    <div style={{
      flex: 1, height: 64, borderRadius: 4,
      background: on ? BFP.esp : 'transparent',
      border: on ? 'none' : `1px solid ${BFP.rule}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 3,
    }}>
      <div style={{
        fontFamily: body, fontSize: 9, fontWeight: 500,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: on ? 'rgba(244,237,225,0.6)' : BFP.muted,
      }}>{day}</div>
      <div style={{
        fontFamily: display, fontSize: 22, fontWeight: 400,
        color: on ? BFP.linen : BFP.text,
        position: 'relative',
      }}>{num}</div>
      {today && !on && <div style={{ width: 4, height: 4, borderRadius: '50%', background: BFP.brown }} />}
    </div>
  );
}

function ClassRow({ c }) {
  const isFull = c.spots === 0;
  const lowSpots = c.spots > 0 && c.spots <= 3;
  return (
    <div style={{
      padding: '18px 20px',
      borderBottom: `1px solid ${BFP.rule}`,
      display: 'flex', alignItems: 'center', gap: 14,
      background: c.booked ? BFP.l2 : 'transparent',
      opacity: isFull ? 0.55 : 1,
      position: 'relative',
    }}>
      {c.booked && (
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: BFP.brown }} />
      )}
      {/* Time column */}
      <div style={{ width: 56, flexShrink: 0 }}>
        <div style={{ fontFamily: display, fontSize: 22, fontWeight: 400, color: BFP.text, lineHeight: 1 }}>{c.time}</div>
        <div style={{ fontFamily: body, fontSize: 10, color: BFP.muted, marginTop: 4, letterSpacing: '0.04em' }}>{c.dur}</div>
      </div>
      {/* Class info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClassDot type={c.type} />
          <div style={{
            fontFamily: body, fontSize: 9.5, fontWeight: 500,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: BFP.muted,
          }}>{c.type}{c.heat ? ` · ${c.heat}` : ''}</div>
        </div>
        <div style={{ fontFamily: display, fontSize: 19, fontWeight: 400, color: BFP.text, marginTop: 4, fontStyle: 'italic' }}>{c.name}</div>
        <div style={{ fontFamily: body, fontSize: 12, color: BFP.mid, marginTop: 3 }}>w/ {c.teacher}</div>
      </div>
      {/* Status */}
      <div style={{ width: 70, flexShrink: 0, textAlign: 'right' }}>
        {c.booked ? (
          <>
            <div style={{ fontFamily: body, fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: BFP.brown }}>Booked</div>
            <div style={{ fontFamily: body, fontSize: 11, color: BFP.muted, marginTop: 4 }}>Tap to manage</div>
          </>
        ) : isFull ? (
          <>
            <div style={{ fontFamily: body, fontSize: 9, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase', color: BFP.muted }}>Waitlist</div>
            <div style={{ fontFamily: body, fontSize: 11, color: BFP.muted, marginTop: 4 }}>+3 ahead</div>
          </>
        ) : (
          <>
            <div style={{ fontFamily: body, fontSize: 11, fontWeight: 500, color: lowSpots ? BFP.rust : BFP.text }}>{c.spots} spots</div>
            <div style={{ fontFamily: body, fontSize: 10, color: BFP.muted, marginTop: 3 }}>left</div>
          </>
        )}
      </div>
    </div>
  );
}

function ScheduleScreen() {
  return (
    <div style={{ height: '100%', background: BFP.linen, position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <StatusBar />
      <AppHeader
        title="Schedule"
        leading={<Brand size={18} />}
        trailing={
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke={BFP.text} strokeWidth="1.4"/>
            <path d="M12 12l3.5 3.5" stroke={BFP.text} strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        }
      />

      {/* Month + filter */}
      <div style={{ padding: '20px 20px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <Lbl>Week of</Lbl>
          <div style={{ fontFamily: display, fontSize: 26, fontWeight: 400, color: BFP.text, marginTop: 4 }}>
            <em style={{ color: BFP.brown }}>March</em> 4–10
          </div>
        </div>
        <div style={{
          fontFamily: body, fontSize: 10, fontWeight: 500,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: BFP.brown, paddingBottom: 4,
        }}>All ↓</div>
      </div>

      {/* Day pills */}
      <div style={{ padding: '4px 16px 16px', display: 'flex', gap: 6 }}>
        {[
          { d: 'Mon', n: 4 },
          { d: 'Tue', n: 5 },
          { d: 'Wed', n: 6, on: true },
          { d: 'Thu', n: 7, today: true },
          { d: 'Fri', n: 8 },
          { d: 'Sat', n: 9 },
          { d: 'Sun', n: 10 },
        ].map(d => <DayPill key={d.d} day={d.d} num={d.n} on={d.on} today={d.today} />)}
      </div>

      {/* Class list */}
      <div style={{ flex: 1, overflow: 'auto', borderTop: `1px solid ${BFP.rule}`, background: BFP.canvas, paddingBottom: 90 }}>
        <div style={{
          padding: '14px 20px 8px',
          background: BFP.canvas,
          fontFamily: body, fontSize: 9.5, fontWeight: 500,
          letterSpacing: '0.18em', textTransform: 'uppercase',
          color: BFP.muted,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span>Wednesday · 7 classes</span>
          <span style={{ color: BFP.brown }}>1 booked</span>
        </div>
        {CLASSES.map((c, i) => <ClassRow key={i} c={c} />)}
      </div>

      <TabBar active="schedule" />
    </div>
  );
}

window.ScheduleScreen = ScheduleScreen;
