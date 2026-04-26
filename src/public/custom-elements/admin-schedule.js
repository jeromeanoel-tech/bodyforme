class AdminSchedule extends HTMLElement {
  constructor() {
    super();
    this._state = {
      view: 'week',
      currentDate: new Date(),
      scheduleData: null,
      filterType: '',
      filterInstructor: '',
    };
  }

  static get observedAttributes() {
    return ['schedule-data', 'view', 'date'];
  }

  attributeChangedCallback(name, _, newVal) {
    if (name === 'schedule-data' && newVal) {
      try { this._state.scheduleData = JSON.parse(newVal); } catch (e) {}
    } else if (name === 'view' && newVal) {
      this._state.view = newVal;
    } else if (name === 'date' && newVal) {
      this._state.currentDate = new Date(newVal);
    }
    if (this.isConnected) this._render();
  }

  connectedCallback() {
    this._render();
  }

  // ── Data helpers ──────────────────────────────────────────────────────────

  _data() {
    return this._state.scheduleData || this._mockData();
  }

  _mockData() {
    const today = new Date();
    const mkDay = (offset, sessions) => {
      const d = new Date(today);
      d.setDate(d.getDate() - offset);
      return {
        date: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }),
        isToday: offset === 0,
        sessions,
      };
    };
    return [
      mkDay(0, [
        { id: 's1', time: '7:00 – 8:00 am',  signedIn: 0,  capacity: 25, name: 'Hot Pilates',   teacher: 'Suzanne' },
        { id: 's2', time: '8:00 – 9:00 am',  signedIn: 19, capacity: 25, name: 'Hot Pilates',   teacher: 'Suzanne' },
        { id: 's3', time: '9:15 – 10:45 am', signedIn: 20, capacity: 25, name: 'Bikram 90 Min', teacher: 'Mish' },
      ]),
      mkDay(1, [
        { id: 's4', time: '8:00 – 9:00 am',  signedIn: 18, capacity: 25, name: 'Arms Abs Ass',  teacher: 'Stephanie' },
      ]),
      mkDay(2, [
        { id: 's5', time: '9:30 – 10:30 am', signedIn: 11, capacity: 25, name: 'Hot Pilates',   teacher: 'Suzanne' },
        { id: 's6', time: '6:00 – 7:00 pm',  signedIn: 9,  capacity: 25, name: 'Bikram Express', teacher: 'Gabriel' },
      ]),
      mkDay(7, [
        { id: 's7', time: '5:45 – 6:45 pm',  signedIn: 19, capacity: 25, name: 'Bikram Express', teacher: 'Angie' },
        { id: 's8', time: '7:00 – 8:00 pm',  signedIn: 11, capacity: 25, name: 'Hot Pilates',   teacher: 'Angie' },
      ]),
    ];
  }

  _classType(name) {
    const n = name.toLowerCase();
    if (n.includes('bikram')) return 'hot';
    if (n.includes('pilates')) return 'pilates';
    if (n.includes('yoga')) return 'yoga';
    return 'strength';
  }

  _classIcon(type) {
    return {
      yoga:     `<svg viewBox="0 0 10 10" fill="none"><path d="M5 2c-2 1-3 3-2 5M5 2c2 1 3 3 2 5" stroke="oklch(0.4 0.1 145)" stroke-width="1.2" stroke-linecap="round"/></svg>`,
      pilates:  `<svg viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="3" stroke="oklch(0.4 0.1 260)" stroke-width="1.2"/></svg>`,
      hot:      `<svg viewBox="0 0 10 10" fill="none"><path d="M5 2c0 2-2 3-2 5M7 3c0 2-2 3-2 5" stroke="oklch(0.5 0.12 30)" stroke-width="1.2" stroke-linecap="round"/></svg>`,
      strength: `<svg viewBox="0 0 10 10" fill="none"><path d="M1 5h8M3 3v4M7 3v4" stroke="oklch(0.4 0.1 200)" stroke-width="1.2" stroke-linecap="round"/></svg>`,
    }[type] || '';
  }

  _dateLabel() {
    const d = this._state.currentDate;
    if (this._state.view === 'day') {
      return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }
    const offset = (d.getDay() + 6) % 7;
    const mon = new Date(d); mon.setDate(d.getDate() - offset);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    const fmt = dd => dd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    return `${fmt(mon)} – ${fmt(sun)} ${sun.getFullYear()}`;
  }

  // ── Render fragments ──────────────────────────────────────────────────────

  _renderSidebar() {
    const navItems = [
      { label: 'Dashboard',           active: false, expand: false,
        icon: `<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".7"/><rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" opacity=".7"/><rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" opacity=".7"/><rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" opacity=".7"/></svg>` },
      { label: 'Classes',             active: true,  expand: false,
        icon: `<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` },
      { label: 'Courses',             active: false, expand: false,
        icon: `<svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>` },
      { label: 'Rooms',               active: false, expand: false,
        icon: `<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="5" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.3"/><path d="M5 5V4a3 3 0 016 0v1" stroke="currentColor" stroke-width="1.3"/></svg>` },
      { label: 'Check In',            active: false, expand: false,
        icon: `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` },
      { divider: true },
      { label: 'Clients',             active: false, expand: false,
        icon: `<svg viewBox="0 0 16 16" fill="none"><circle cx="6" cy="6" r="2.5" stroke="currentColor" stroke-width="1.3"/><circle cx="11" cy="9" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M2 12c0-1.66 1.34-3 3-3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` },
      { label: 'Point of Sale',       active: false, expand: false,
        icon: `<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="10" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5 14h6M8 12v2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` },
      { label: 'Insights',            active: false, expand: true,
        icon: `<svg viewBox="0 0 16 16" fill="none"><path d="M2 12L6 7l3 3 2-4 3 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>` },
      { label: 'Marketing',           active: false, expand: true,
        icon: `<svg viewBox="0 0 16 16" fill="none"><path d="M8 2a6 6 0 100 12A6 6 0 008 2z" stroke="currentColor" stroke-width="1.3"/><path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` },
      { label: 'Services &amp; Products', active: false, expand: true,
        icon: `<svg viewBox="0 0 16 16" fill="none"><path d="M3 5h10M3 8h10M3 11h7" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` },
      { label: 'Staff',               active: false, expand: false,
        icon: `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" stroke="currentColor" stroke-width="1.3"/><path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` },
      { label: 'Settings',            active: false, expand: false,
        icon: `<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 5.5v3l1.5 1.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>` },
    ];

    const items = navItems.map(item => {
      if (item.divider) return `<div class="nav-divider"></div>`;
      return `
        <div class="nav-item${item.active ? ' active' : ''}" data-label="${item.label}">
          ${item.icon}
          ${item.label}
          ${item.expand ? '<span class="nav-expand">›</span>' : ''}
        </div>`;
    }).join('');

    return `
      <aside class="sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">
            <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="2.5" fill="white"/><path d="M3 13c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="white" stroke-width="1.5" stroke-linecap="round"/></svg>
          </div>
          <div class="logo-text">Body<span>forme</span></div>
        </div>
        <nav class="sidebar-nav">${items}</nav>
        <div class="sidebar-footer">
          <div class="ai-dot"></div>
          <span>AI Assistant</span>
        </div>
      </aside>`;
  }

  _renderTopbar() {
    return `
      <header class="topbar">
        <button class="hamburger" id="hamburger-btn">
          <svg viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
        <div class="search-wrap">
          <svg viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.5" stroke="currentColor" stroke-width="1.4"/><path d="M10.5 10.5L14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          <input class="search-input" type="text" placeholder="Find a client…" id="client-search">
        </div>
        <div class="topbar-actions">
          <button class="tb-btn" title="History">
            <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M8 5v3l2 2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
          <button class="tb-btn" title="Tasks">
            <svg viewBox="0 0 16 16" fill="none"><path d="M3 5l2 2 4-4M3 11l2 2 4-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="tb-btn" title="Reports">
            <svg viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5 9l2-3 2 2 2-4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="tb-btn" title="Help">
            <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="currentColor" stroke-width="1.3"/><path d="M6.5 6.5C6.5 5.7 7.1 5 8 5s1.5.7 1.5 1.5c0 1-1.5 1.5-1.5 2.5M8 11.5v.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          </button>
          <button class="tb-btn" title="Notifications" style="position:relative" id="notif-btn">
            <svg viewBox="0 0 16 16" fill="none"><path d="M8 2a4 4 0 014 4v3l1.5 2H2.5L4 9V6a4 4 0 014-4z" stroke="currentColor" stroke-width="1.3"/><path d="M6.5 13a1.5 1.5 0 003 0" stroke="currentColor" stroke-width="1.3"/></svg>
            <span class="badge">3</span>
          </button>
          <div class="avatar" title="Account">JN</div>
        </div>
      </header>`;
  }

  _renderCalToolbar() {
    const view = this._state.view;
    return `
      <div class="cal-toolbar">
        <div class="date-chip">
          <svg viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M5 2v2M11 2v2M2 7h12" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
          ${this._dateLabel()}
        </div>
        <button class="btn-today" id="today-btn">Today</button>
        <div class="nav-arrow" id="prev-btn">
          <svg viewBox="0 0 12 12" fill="none"><path d="M7.5 9L4.5 6l3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div class="view-tabs">
          <div class="view-tab${view === 'day'   ? ' active' : ''}" data-view="day">
            <svg viewBox="0 0 12 12" fill="none"><path d="M2 6h8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            Day
          </div>
          <div class="view-tab${view === 'week'  ? ' active' : ''}" data-view="week">
            <svg viewBox="0 0 12 12" fill="none"><path d="M1.5 6h9M4 3v6M8 3v6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
            Week
          </div>
          <div class="view-tab${view === 'month' ? ' active' : ''}" data-view="month">
            <svg viewBox="0 0 12 12" fill="none"><rect x="1" y="1.5" width="10" height="9" rx="1" stroke="currentColor" stroke-width="1.3"/></svg>
            Month
          </div>
        </div>
        <div class="nav-arrow" id="next-btn">
          <svg viewBox="0 0 12 12" fill="none"><path d="M4.5 9L7.5 6l-3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </div>
        <div style="flex:1"></div>
        <div class="filter-btn" id="filter-type-btn">
          All Class Types
          <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </div>
        <div class="filter-btn" id="filter-instructor-btn">
          All Instructors
          <svg viewBox="0 0 12 12" fill="none"><path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>
        </div>
      </div>`;
  }

  _renderDayBlocks() {
    return this._data().map((day, i) => {
      const totalIn  = day.sessions.reduce((s, c) => s + c.signedIn, 0);
      const totalCap = day.sessions.reduce((s, c) => s + c.capacity, 0);
      const pct = totalCap > 0 ? ((totalIn / totalCap) * 100).toFixed(0) : 0;

      const rows = day.sessions.map(s => {
        const type = this._classType(s.name);
        return `
          <div class="class-row" data-session-id="${s.id}">
            <div class="time-col">${s.time}</div>
            <div class="signin-col">Sign In (<span class="signin-count">${s.signedIn}</span>/${s.capacity})</div>
            <div class="class-name-col">
              <div class="class-icon ${type}">${this._classIcon(type)}</div>
              <a class="class-link" href="#" data-session-id="${s.id}">${s.name}</a>
            </div>
            <div class="teacher-col">
              <input type="checkbox" class="teacher-check">
              <span class="teacher-name">${s.teacher}</span>
              <span class="teacher-tag">—</span>
            </div>
            <div class="actions-col">
              <button class="dot-btn" data-session-id="${s.id}">⋯</button>
            </div>
          </div>`;
      }).join('');

      return `
        <div class="day-block" style="animation-delay:${(i * 0.05) + 0.05}s">
          <div class="day-header${day.isToday ? ' today-header' : ''}">
            <div class="day-header-left">
              <span class="day-name">${day.label}</span>
              ${day.isToday ? '<span class="today-badge">TODAY</span>' : ''}
              <span class="day-signed"${day.isToday ? ' style="margin-left:4px"' : ''}>Signed in ${totalIn} (${pct}%)</span>
            </div>
            <span class="col-label">Classes <span style="font-weight:400;text-transform:none;letter-spacing:0">(Click for details)</span></span>
            <span class="col-label">Teacher <span style="font-weight:400;text-transform:none;letter-spacing:0">(Check box to edit)</span></span>
            <span class="col-label">Edit</span>
          </div>
          ${rows}
        </div>`;
    }).join('');
  }

  _renderStatsFooter() {
    const days   = this._data();
    const total  = days.reduce((s, d) => s + d.sessions.length, 0);
    const in_    = days.reduce((s, d) => d.sessions.reduce((ss, c) => ss + c.signedIn, ss), 0);
    const cap    = days.reduce((s, d) => d.sessions.reduce((ss, c) => ss + c.capacity, ss), 0);
    const util   = cap > 0 ? ((in_ / cap) * 100).toFixed(2) : '0.00';
    const active = days.filter(d => d.sessions.length > 0).length;
    const avg    = active > 0 ? (in_ / active).toFixed(2) : '0.00';
    return `
      <div class="stats-footer">
        <div class="stats-grid">
          <div class="stat-line">Total classes this week: <strong>${total}</strong></div>
          <div class="stat-line">Total signed in: <strong>${in_}</strong> &nbsp;/&nbsp; Total capacity: <strong>${cap}</strong></div>
          <div class="stat-line">Capacity utilisation: <strong>${util}%</strong></div>
        </div>
        <div class="stat-highlight">Weekly average: ${avg} clients signed in per day</div>
      </div>`;
  }

  // ── Main render ───────────────────────────────────────────────────────────

  _render() {
    this.innerHTML = `
<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Plus+Jakarta+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --espresso:   #1e110a;
  --espresso-2: #2c1a10;
  --espresso-3: #3a2318;
  --cream:      #faf6ef;
  --cream-2:    #f3ede3;
  --cream-3:    #e8dfd2;
  --linen:      #f0e9de;
  --terra:      #b8674a;
  --terra-lt:   #d4896e;
  --terra-md:   #c97a5e;
  --sage:       #7a9482;
  --tx-dark:    #1e110a;
  --tx-mid:     #6b5344;
  --tx-light:   #9c7d6a;
  --border:     #e0d5c8;
  --sb-w:       220px;
  --tb-h:       52px;
}

.admin-root {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  color: var(--tx-dark);
  background: var(--cream);
}

/* ── Sidebar ── */
.sidebar {
  width: var(--sb-w);
  background: var(--espresso);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}
.sidebar::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 0%,  oklch(0.35 0.04 40 / 0.5) 0%, transparent 60%),
    radial-gradient(ellipse at 80% 100%, oklch(0.25 0.03 30 / 0.4) 0%, transparent 60%);
  pointer-events: none;
}
.sidebar-logo {
  padding: 18px 20px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid oklch(1 0 0 / 0.06);
  position: relative;
}
.logo-mark {
  width: 30px; height: 30px;
  background: var(--terra);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.logo-mark svg { width: 16px; height: 16px; }
.logo-text {
  font-family: 'Cormorant Garamond', serif;
  font-size: 17px;
  font-weight: 600;
  color: var(--cream);
  letter-spacing: 0.02em;
  line-height: 1;
}
.logo-text span { color: var(--terra-lt); }

.sidebar-nav {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
  position: relative;
}
.sidebar-nav::-webkit-scrollbar { display: none; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 20px;
  color: oklch(0.85 0.02 60);
  cursor: pointer;
  font-size: 12.5px;
  font-weight: 400;
  letter-spacing: 0.01em;
  transition: all 0.15s;
  position: relative;
  user-select: none;
}
.nav-item:hover { color: var(--cream); background: oklch(1 0 0 / 0.05); }
.nav-item.active { color: var(--cream); background: oklch(1 0 0 / 0.08); font-weight: 500; }
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0; top: 4px; bottom: 4px;
  width: 3px;
  background: var(--terra);
  border-radius: 0 2px 2px 0;
}
.nav-item svg { width: 15px; height: 15px; opacity: 0.75; flex-shrink: 0; }
.nav-item.active svg { opacity: 1; }
.nav-expand { margin-left: auto; opacity: 0.4; font-size: 10px; }
.nav-divider { height: 1px; background: oklch(1 0 0 / 0.06); margin: 8px 0; }

.sidebar-footer {
  padding: 14px 20px;
  border-top: 1px solid oklch(1 0 0 / 0.06);
  display: flex; align-items: center; gap: 10px;
  cursor: pointer;
  position: relative;
}
.ai-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: var(--sage);
  box-shadow: 0 0 6px var(--sage);
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
.sidebar-footer span { color: oklch(0.82 0.02 60); font-size: 12px; }

/* ── Main ── */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--cream);
}

/* ── Topbar ── */
.topbar {
  height: var(--tb-h);
  background: oklch(0.99 0.005 80);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center;
  padding: 0 20px; gap: 12px;
  flex-shrink: 0;
}
.hamburger {
  width: 34px; height: 34px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; flex-shrink: 0;
  transition: background 0.15s;
}
.hamburger:hover { background: var(--cream-2); }
.hamburger svg { width: 14px; height: 14px; color: var(--tx-mid); }

.search-wrap { flex: 1; max-width: 340px; position: relative; }
.search-wrap svg {
  position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
  width: 14px; height: 14px; color: var(--tx-light);
}
.search-input {
  width: 100%; height: 34px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  padding: 0 12px 0 32px;
  font-family: inherit; font-size: 12.5px; color: var(--tx-dark);
  outline: none; transition: border-color 0.15s, box-shadow 0.15s;
}
.search-input::placeholder { color: var(--tx-light); }
.search-input:focus { border-color: var(--terra); box-shadow: 0 0 0 3px oklch(0.65 0.12 30 / 0.12); }

.topbar-actions { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.tb-btn {
  width: 34px; height: 34px;
  border-radius: 8px; border: none; background: transparent;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--tx-mid); position: relative;
  transition: background 0.15s;
}
.tb-btn:hover { background: var(--cream-2); }
.tb-btn svg { width: 16px; height: 16px; }
.badge {
  position: absolute; top: 5px; right: 5px;
  width: 15px; height: 15px;
  border-radius: 50%;
  background: var(--terra); color: white;
  font-size: 9px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  border: 2px solid white;
}
.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--espresso-3); color: var(--cream);
  font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; margin-left: 4px; letter-spacing: 0.02em;
}

/* ── Content ── */
.content { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

/* ── Calendar toolbar ── */
.cal-toolbar {
  padding: 12px 24px;
  display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid var(--border);
  background: var(--cream); flex-shrink: 0;
}
.date-chip {
  display: flex; align-items: center; gap: 8px;
  padding: 0 12px; height: 32px;
  border: 1px solid var(--border); border-radius: 8px;
  background: white; font-size: 12.5px; color: var(--tx-dark);
  cursor: pointer; font-weight: 500; white-space: nowrap;
}
.date-chip svg { width: 13px; height: 13px; color: var(--tx-light); }
.btn-today {
  height: 32px; padding: 0 14px; border-radius: 8px; border: none;
  background: var(--terra); color: white;
  font-family: inherit; font-size: 12.5px; font-weight: 500;
  cursor: pointer; transition: background 0.15s; letter-spacing: 0.01em;
}
.btn-today:hover { background: var(--terra-md); }
.view-tabs {
  display: flex; border: 1px solid var(--border);
  border-radius: 8px; overflow: hidden; background: white;
}
.view-tab {
  display: flex; align-items: center; gap: 5px;
  padding: 0 10px; height: 32px;
  font-size: 12.5px; color: var(--tx-mid);
  cursor: pointer; border-right: 1px solid var(--border);
  transition: all 0.15s; user-select: none;
}
.view-tab:last-child { border-right: none; }
.view-tab:hover { background: var(--cream-2); }
.view-tab.active { background: var(--espresso); color: var(--cream); font-weight: 500; }
.view-tab svg { width: 11px; height: 11px; }
.nav-arrow {
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid var(--border); background: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--tx-mid); transition: all 0.15s;
}
.nav-arrow:hover { background: var(--cream-2); border-color: var(--cream-3); }
.nav-arrow svg { width: 12px; height: 12px; }
.filter-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 0 12px; height: 32px;
  border: 1px solid var(--border); border-radius: 8px;
  background: white; font-family: inherit;
  font-size: 12.5px; color: var(--tx-dark);
  cursor: pointer; white-space: nowrap; transition: all 0.15s;
}
.filter-btn:hover { border-color: var(--cream-3); background: var(--cream-2); }
.filter-btn svg { width: 11px; height: 11px; color: var(--tx-light); }

/* ── Schedule ── */
.schedule { flex: 1; overflow-y: auto; padding: 0 0 40px; }
.schedule::-webkit-scrollbar { width: 6px; }
.schedule::-webkit-scrollbar-track { background: transparent; }
.schedule::-webkit-scrollbar-thumb { background: var(--cream-3); border-radius: 3px; }

.day-block { border-bottom: 1px solid var(--border); animation: fadeSlide 0.3s ease both; }
@keyframes fadeSlide { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

.day-header {
  display: grid;
  grid-template-columns: 180px 1fr 240px 180px 80px;
  align-items: center;
  padding: 10px 24px;
  background: var(--linen);
  border-bottom: 1px solid var(--border);
  gap: 12px; position: sticky; top: 0; z-index: 5;
}
.today-header { background: oklch(0.96 0.015 40); }
.day-header-left { display: flex; align-items: baseline; gap: 8px; }
.day-name { font-size: 13px; font-weight: 600; color: var(--tx-dark); }
.day-date { font-size: 11.5px; color: var(--tx-mid); font-weight: 400; }
.day-signed {
  font-size: 11px; color: var(--tx-light);
  background: var(--cream-2); padding: 2px 8px;
  border-radius: 20px; border: 1px solid var(--border);
}
.today-badge {
  display: inline-flex; align-items: center;
  background: var(--terra); color: white;
  font-size: 10px; font-weight: 600;
  padding: 1px 7px; border-radius: 10px; letter-spacing: 0.04em;
  margin-left: 6px;
}
.col-label {
  font-size: 10.5px; font-weight: 600;
  color: var(--tx-light); letter-spacing: 0.06em; text-transform: uppercase;
}

.class-row {
  display: grid;
  grid-template-columns: 180px 1fr 240px 180px 80px;
  align-items: center; padding: 10px 24px;
  border-bottom: 1px solid oklch(0.9 0.01 80 / 0.6);
  gap: 12px; transition: background 0.12s; cursor: pointer;
}
.class-row:hover { background: oklch(0.97 0.008 70); }
.class-row:last-child { border-bottom: none; }

.time-col   { font-size: 12px; color: var(--tx-mid); }
.signin-col { font-size: 12px; color: var(--tx-mid); }
.signin-count { font-weight: 600; color: var(--tx-dark); }
.class-name-col { display: flex; align-items: center; gap: 7px; }
.class-icon {
  width: 20px; height: 20px; border-radius: 5px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.class-icon.yoga     { background: oklch(0.9 0.06 145); }
.class-icon.pilates  { background: oklch(0.9 0.06 260); }
.class-icon.hot      { background: oklch(0.9 0.06 30);  }
.class-icon.strength { background: oklch(0.9 0.06 200); }
.class-icon svg { width: 10px; height: 10px; }
.class-link {
  font-size: 12.5px; color: var(--terra); font-weight: 500; text-decoration: none;
}
.class-link:hover { text-decoration: underline; }
.teacher-col { display: flex; align-items: center; gap: 8px; }
.teacher-check {
  width: 15px; height: 15px;
  border: 1.5px solid var(--border); border-radius: 4px;
  flex-shrink: 0; cursor: pointer; appearance: none;
  background: white; transition: all 0.15s;
}
.teacher-check:checked { background: var(--terra); border-color: var(--terra); }
.teacher-name { font-size: 12.5px; color: var(--tx-dark); }
.teacher-tag {
  font-size: 10px; color: var(--tx-light);
  background: var(--cream-2); padding: 1px 6px;
  border-radius: 10px; border: 1px solid var(--border);
}
.actions-col { display: flex; align-items: center; justify-content: flex-end; gap: 6px; }
.dot-btn {
  width: 24px; height: 24px; border-radius: 6px;
  border: none; background: transparent;
  cursor: pointer; color: var(--tx-light);
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s; font-size: 14px;
}
.dot-btn:hover { background: var(--cream-2); color: var(--tx-mid); }

/* ── Stats footer ── */
.stats-footer {
  padding: 20px 24px;
  background: var(--cream); border-top: 1px solid var(--border);
}
.stats-grid { display: flex; flex-direction: column; gap: 5px; margin-bottom: 12px; }
.stat-line { font-size: 12px; color: var(--tx-mid); line-height: 1.5; }
.stat-line strong { color: var(--tx-dark); font-weight: 600; }
.stat-highlight {
  font-size: 13px; font-weight: 600; color: var(--tx-dark);
  padding-top: 8px; border-top: 1px solid var(--border); margin-top: 4px;
}

/* ── Page footer ── */
.page-footer {
  padding: 12px 24px;
  background: oklch(0.97 0.005 80); border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0;
}
.pf-brand {
  font-family: 'Cormorant Garamond', serif;
  font-size: 14px; font-weight: 600; color: var(--tx-mid); letter-spacing: 0.02em;
}
.pf-links { display: flex; gap: 16px; }
.pf-link { font-size: 11px; color: var(--tx-light); cursor: pointer; }
.pf-link:hover { text-decoration: underline; }
.pf-id { font-size: 11px; color: var(--tx-light); }
</style>

<div class="admin-root">
  ${this._renderSidebar()}
  <div class="main">
    ${this._renderTopbar()}
    <div class="content">
      ${this._renderCalToolbar()}
      <div class="schedule" id="schedule-list">
        ${this._renderDayBlocks()}
        ${this._renderStatsFooter()}
      </div>
      <div class="page-footer">
        <div class="pf-brand">bodyforme</div>
        <div class="pf-links">
          <span class="pf-link">© 2026 Bodyforme</span>
          <span class="pf-link">Terms of Service</span>
          <span class="pf-link">Privacy Policy</span>
        </div>
        <div class="pf-id">Admin Dashboard</div>
      </div>
    </div>
  </div>
</div>`;

    this._attachEvents();
  }

  // ── Events ────────────────────────────────────────────────────────────────

  _attachEvents() {
    // View tabs
    this.querySelectorAll('.view-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this._state.view = tab.dataset.view;
        this._render();
        this.dispatchEvent(new CustomEvent('view-change', { detail: { view: this._state.view }, bubbles: true }));
      });
    });

    // Today
    const todayBtn = this.querySelector('#today-btn');
    if (todayBtn) todayBtn.addEventListener('click', () => {
      this._state.currentDate = new Date();
      this._render();
      this.dispatchEvent(new CustomEvent('date-change', { detail: { date: this._state.currentDate.toISOString() }, bubbles: true }));
    });

    // Prev / Next
    const step = () => this._state.view === 'day' ? 1 : this._state.view === 'month' ? 30 : 7;
    const prevBtn = this.querySelector('#prev-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => {
      this._state.currentDate.setDate(this._state.currentDate.getDate() - step());
      this._state.currentDate = new Date(this._state.currentDate);
      this._render();
      this.dispatchEvent(new CustomEvent('date-change', { detail: { date: this._state.currentDate.toISOString() }, bubbles: true }));
    });
    const nextBtn = this.querySelector('#next-btn');
    if (nextBtn) nextBtn.addEventListener('click', () => {
      this._state.currentDate.setDate(this._state.currentDate.getDate() + step());
      this._state.currentDate = new Date(this._state.currentDate);
      this._render();
      this.dispatchEvent(new CustomEvent('date-change', { detail: { date: this._state.currentDate.toISOString() }, bubbles: true }));
    });

    // Class name links
    this.querySelectorAll('.class-link').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        this.dispatchEvent(new CustomEvent('class-click', { detail: { sessionId: link.dataset.sessionId }, bubbles: true }));
      });
    });

    // Dot menu
    this.querySelectorAll('.dot-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('session-menu', { detail: { sessionId: btn.dataset.sessionId }, bubbles: true }));
      });
    });

    // Nav items
    this.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        item.classList.add('active');
        this.dispatchEvent(new CustomEvent('nav-click', { detail: { label: item.dataset.label }, bubbles: true }));
      });
    });

    // Filter buttons (placeholder — will open dropdowns in next phase)
    const ftBtn = this.querySelector('#filter-type-btn');
    if (ftBtn) ftBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('filter-open', { detail: { filter: 'type' }, bubbles: true }));
    });
    const fiBtn = this.querySelector('#filter-instructor-btn');
    if (fiBtn) fiBtn.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('filter-open', { detail: { filter: 'instructor' }, bubbles: true }));
    });
  }
}

customElements.define('admin-schedule', AdminSchedule);
