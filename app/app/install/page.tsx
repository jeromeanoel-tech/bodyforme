'use client'

import { useState } from 'react'

const APP_URL      = 'bodyforme.com.au/app'
const APP_URL_FULL = `https://${APP_URL}`

export default function InstallPage() {
  const [copied,   setCopied]   = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios')

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(APP_URL_FULL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch { /* fallback — can't copy */ }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.92); }
        }
        @keyframes pulse2 {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .tap-ring {
          position: absolute;
          width: 24px; height: 24px;
          border: 2px solid #7a4a2a;
          border-radius: 50%;
          pointer-events: none;
          z-index: 40;
          animation: pulse 1.6s ease-in-out infinite;
        }
        .tap-ring::after {
          content: '';
          position: absolute;
          inset: -6px;
          border: 1.5px solid #7a4a2a;
          border-radius: 50%;
          opacity: 0.4;
          animation: pulse2 1.6s ease-out infinite;
        }
        @media print {
          body { background: #fff; }
          .no-print { display: none !important; }
        }

        /* ── Responsive layout ── */
        .install-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 28px 20px 56px;
        }
        .install-brand-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 14px;
          border-bottom: 1px solid #d8ccba;
          margin-bottom: 28px;
        }
        .install-hero {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 32px;
          border-bottom: 1px solid #d8ccba;
        }
        .install-hero-heading {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 42px;
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin: 0;
          color: #2a1506;
        }
        .install-hero-heading img {
          height: 36px;
          width: auto;
          vertical-align: middle;
        }
        .install-hero-body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.7;
          color: #6b4e36;
          margin: 0 0 18px;
        }
        /* Platform tabs — mobile only */
        .platform-tabs {
          display: flex;
          gap: 0;
          border: 1px solid #d8ccba;
          overflow: hidden;
          margin-bottom: 0;
        }
        .platform-tab {
          flex: 1;
          padding: 12px 8px;
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: background 0.15s;
        }
        .platform-tab.active   { background: #2a1506; color: #f4ede1; }
        .platform-tab.inactive { background: #f4ede1; color: #a08568; }
        /* Desktop layout */
        .install-platforms-desktop {
          display: none;
        }
        .install-platforms-mobile {
          display: block;
          padding-top: 28px;
        }
        .install-col-heading {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 28px;
          font-weight: 400;
          margin: 0;
          line-height: 1;
          color: #2a1506;
        }
        .install-step-row {
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 24px 0;
          border-bottom: 1px solid #d8ccba;
        }
        .install-step-row.last { border-bottom: none; }
        .install-step-header {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 8px;
        }
        .install-step-num {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 36px;
          font-weight: 300;
          color: #7a4a2a;
          line-height: 1;
          font-style: italic;
          flex-shrink: 0;
        }
        .install-step-title {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 18px;
          font-weight: 400;
          line-height: 1.2;
          margin: 0 0 6px;
          color: #2a1506;
        }
        .install-step-body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 13px;
          font-weight: 300;
          line-height: 1.65;
          margin: 0;
          color: #6b4e36;
        }
        .install-step-mockup {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }
        .install-footer {
          margin-top: 40px;
          padding-top: 28px;
          border-top: 1px solid #d8ccba;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .install-footer-text {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 16px;
          line-height: 1.4;
          color: #2a1506;
        }
        .install-footer-meta {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #a08568;
          line-height: 1.8;
        }

        @media (min-width: 768px) {
          .install-inner {
            padding: 64px 56px 80px;
          }
          .install-hero {
            display: grid;
            grid-template-columns: 1.05fr 0.95fr;
            gap: 56px;
            align-items: start;
            padding-bottom: 48px;
          }
          .install-hero-heading {
            font-size: 76px;
          }
          .install-hero-heading img {
            height: 64px;
          }
          .platform-tabs {
            display: none;
          }
          .install-platforms-desktop {
            display: grid;
            grid-template-columns: 1fr 1px 1fr;
            gap: 0;
            padding-top: 48px;
          }
          .install-platforms-mobile {
            display: none;
          }
          .install-col-heading {
            font-size: 38px;
          }
          .install-step-row {
            display: grid;
            grid-template-columns: 60px 1fr;
            padding: 28px 0;
          }
          .install-step-header {
            display: block;
            margin-bottom: 0;
          }
          .install-step-num {
            font-size: 44px;
          }
          .install-step-inner {
            display: grid;
            grid-template-columns: 1fr 168px;
            gap: 24px;
            align-items: start;
          }
          .install-step-title {
            font-size: 22px;
            margin-bottom: 8px;
          }
          .install-step-body {
            font-size: 13px;
          }
          .install-step-mockup {
            justify-content: flex-end;
            margin-top: 0;
          }
          .install-footer {
            margin-top: 56px;
            padding-top: 32px;
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 32px;
            align-items: end;
          }
          .install-footer-text {
            font-size: 22px;
          }
          .install-footer-meta {
            text-align: right;
          }
        }
      `}</style>

      <div style={{ background: '#f4ede1', minHeight: '100vh', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", WebkitFontSmoothing: 'antialiased' }}>
        <div className="install-inner">

          {/* Brand bar */}
          <div className="install-brand-bar">
            <img src="/bodyformeBlogo.png" alt="BodyForme" style={{ height: 24, width: 'auto', display: 'block' }} />
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a08568' }}>
              Member app · Install guide
            </div>
          </div>

          {/* Hero: heading + URL card */}
          <div className="install-hero">
            <h1 className="install-hero-heading">
              Add <img src="/bodyforme-wordmark.png" alt="BodyForme" /><br />
              to your <em style={{ color: '#7a4a2a', fontWeight: 400 }}>home screen</em>.
            </h1>
            <div>
              <p className="install-hero-body">
                Our member app lives on the web — there&apos;s nothing to download from a store. Just open the link below in your phone&apos;s browser, then add it to your home screen for one-tap access to bookings, schedule and your membership.
              </p>
              <div style={{ background: '#2a1506', color: '#f4ede1', padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(244,237,225,0.5)', marginBottom: 5 }}>
                    Open in your browser
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 15, fontWeight: 500, color: '#f4ede1', letterSpacing: '0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {APP_URL.split('/app')[0]}/<em style={{ color: '#c4a882', fontStyle: 'normal' }}>app</em>
                  </div>
                </div>
                <button
                  className="no-print"
                  onClick={handleCopy}
                  style={{
                    flexShrink: 0, border: '1px solid rgba(244,237,225,0.35)', padding: '10px 14px',
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500,
                    letterSpacing: '0.18em', textTransform: 'uppercase', color: copied ? '#2a1506' : '#f4ede1',
                    cursor: 'pointer', background: copied ? '#c4a882' : 'transparent',
                    borderColor: copied ? '#c4a882' : 'rgba(244,237,225,0.35)',
                    transition: 'background 0.2s ease',
                  }}
                >
                  {copied ? 'Copied ✓' : 'Copy link'}
                </button>
              </div>
            </div>
          </div>

          {/* ── Mobile: platform tabs ── */}
          <div className="platform-tabs" style={{ marginTop: 28 }}>
            <button
              className={`platform-tab ${platform === 'ios' ? 'active' : 'inactive'}`}
              onClick={() => setPlatform('ios')}
            >
              iPhone &amp; iPad
            </button>
            <button
              className={`platform-tab ${platform === 'android' ? 'active' : 'inactive'}`}
              onClick={() => setPlatform('android')}
            >
              Android
            </button>
          </div>

          {/* ── Mobile: selected platform steps ── */}
          <div className="install-platforms-mobile">
            {platform === 'ios' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #d8ccba', marginBottom: 0 }}>
                  <h2 className="install-col-heading">
                    <em style={{ color: '#7a4a2a' }}>iPhone</em> &amp; iPad
                  </h2>
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a08568' }}>Use Safari</div>
                </div>
                <MobileStep num="1" title="Open the link in Safari." body={<>Type or paste <strong>bodyforme.com.au/app</strong> into Safari&apos;s address bar. The browser must be Safari — not Chrome, not the in-app browser inside Instagram or Facebook.</>}>
                  <MockPhone type="ios"><StatusBar /><ChromeBar /><WebpagePreview /><IosToolbar /></MockPhone>
                </MobileStep>
                <MobileStep num="2" title="Tap the Share button." body={<>It&apos;s the square-with-an-arrow icon in the centre of Safari&apos;s bottom toolbar.</>} keytap={<><ShareIcon /> Share</>}>
                  <MockPhone type="ios"><StatusBar /><ChromeBar /><WebpagePreview short /><IosToolbar highlightShare /></MockPhone>
                </MobileStep>
                <MobileStep num="3" title={<>Choose &ldquo;Add to Home Screen&rdquo;.</>} body="Scroll down through the share sheet until you see it.">
                  <MockPhone type="ios"><StatusBar minimal /><div style={{ height: '60%', background: 'rgba(42,21,6,0.35)' }} /><ShareSheet /></MockPhone>
                </MobileStep>
                <MobileStep num="4" title={<>Tap &ldquo;Add&rdquo; in the top corner.</>} body={<>You&apos;ll see the Bodyforme icon and name — then tap <strong>Add</strong> in the top-right.</>}>
                  <MockPhone type="ios">
                    <StatusBar minimal />
                    <div style={{ background: '#fdfaf6', borderBottom: '1px solid #d8ccba', padding: '4px 8px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 8, color: '#6b4e36' }}>Cancel</div>
                      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 600, color: '#2a1506' }}>Add to Home Screen</div>
                      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 8, fontWeight: 600, color: '#7a4a2a', position: 'relative' }}>
                        Add<span className="tap-ring" style={{ right: -8, top: -6 }} />
                      </div>
                    </div>
                  </MockPhone>
                </MobileStep>
                <MobileStep num="5" title="Open Bodyforme any time." body="The app icon now sits on your home screen. Tap it to launch — the browser chrome is hidden, just like a regular app." last>
                  <MockPhone type="ios"><StatusBar /><HomeGrid highlightIdx={5} /></MockPhone>
                </MobileStep>
              </div>
            )}
            {platform === 'android' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid #d8ccba', marginBottom: 0 }}>
                  <h2 className="install-col-heading"><em style={{ color: '#7a4a2a' }}>Android</em></h2>
                  <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a08568' }}>Use Chrome</div>
                </div>
                <MobileStep num="1" title="Open the link in Chrome." body={<>Type or paste <strong>bodyforme.com.au/app</strong> into Chrome&apos;s address bar.</>}>
                  <MockPhone type="android"><StatusBar /><ChromeBar android /><WebpagePreview /></MockPhone>
                </MobileStep>
                <MobileStep num="2" title="Open the browser menu." body="Tap the three-dot menu icon in the top-right of Chrome." keytap={<><DotsIcon /> More options</>}>
                  <MockPhone type="android"><StatusBar minimal /><ChromeBar android highlightMenu /><WebpagePreview short /></MockPhone>
                </MobileStep>
                <MobileStep num="3" title={<>Choose &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.</>} body="The exact wording depends on your phone. Both options do the same thing.">
                  <MockPhone type="android"><StatusBar minimal /><ChromeBar android /><div style={{ opacity: 0.4 }}><WebpagePreview short /></div><AndroidMenu /></MockPhone>
                </MobileStep>
                <MobileStep num="4" title={<>Confirm with &ldquo;Install&rdquo;.</>} body={<>A small dialog will pop up. Tap <strong>Install</strong> (or <strong>Add</strong>) to confirm.</>}>
                  <MockPhone type="android">
                    <StatusBar minimal />
                    <div style={{ background: '#fdfaf6', borderBottom: '1px solid #d8ccba', padding: '4px 8px 6px', display: 'flex', alignItems: 'center' }}>
                      <div style={{ flex: 1, background: '#ede4d4', borderRadius: 6, padding: '5px 8px', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 8, color: '#2a1506', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', whiteSpace: 'nowrap' }}>🔒 bodyforme.com.au/app</div>
                    </div>
                    <div style={{ opacity: 0.5 }}><WebpagePreview short /></div>
                    <InstallDialog />
                  </MockPhone>
                </MobileStep>
                <MobileStep num="5" title="Open Bodyforme any time." body="The Bodyforme icon now sits with your other apps. Tap it to launch — full-screen, no browser bars." last>
                  <MockPhone type="android"><StatusBar /><HomeGrid highlightIdx={2} /></MockPhone>
                </MobileStep>
              </div>
            )}
          </div>

          {/* ── Desktop: two-column iOS + Android ── */}
          <div className="install-platforms-desktop">

            {/* iPhone column */}
            <div style={{ paddingRight: 36 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid #d8ccba' }}>
                <h2 style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 38, fontWeight: 400, margin: 0, lineHeight: 1, color: '#2a1506' }}><em style={{ color: '#7a4a2a' }}>iPhone</em> &amp; iPad</h2>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a08568' }}>Use Safari</div>
              </div>
              <Step num="1" title="Open the link in Safari." body={<>Type or paste <strong>bodyforme.com.au/app</strong> into Safari&apos;s address bar. The browser must be Safari — not Chrome, not the in-app browser inside Instagram or Facebook.</>}>
                <MockPhone type="ios"><StatusBar /><ChromeBar /><WebpagePreview /><IosToolbar /></MockPhone>
              </Step>
              <Step num="2" title="Tap the Share button." body={<>It&apos;s the square-with-an-arrow icon in the centre of Safari&apos;s bottom toolbar. On older iOS, it&apos;s at the top.</>} keytap={<><ShareIcon /> Share</>}>
                <MockPhone type="ios"><StatusBar /><ChromeBar /><WebpagePreview short /><IosToolbar highlightShare /></MockPhone>
              </Step>
              <Step num="3" title={<>Choose &ldquo;Add to Home Screen&rdquo;.</>} body="Scroll down through the share sheet until you see it. The icon looks like a square with a + inside.">
                <MockPhone type="ios"><StatusBar minimal /><div style={{ height: '60%', background: 'rgba(42,21,6,0.35)' }} /><ShareSheet /></MockPhone>
              </Step>
              <Step num="4" title={<>Tap &ldquo;Add&rdquo; in the top corner.</>} body={<>You&apos;ll see the Bodyforme icon and name — feel free to keep it as is, then tap <strong>Add</strong> in the top-right.</>}>
                <MockPhone type="ios">
                  <StatusBar minimal />
                  <div style={{ background: '#fdfaf6', borderBottom: '1px solid #d8ccba', padding: '4px 8px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 8, color: '#6b4e36' }}>Cancel</div>
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 600, color: '#2a1506' }}>Add to Home Screen</div>
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 8, fontWeight: 600, color: '#7a4a2a', position: 'relative' }}>Add<span className="tap-ring" style={{ right: -8, top: -6 }} /></div>
                  </div>
                  <div style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 12, borderBottom: '1px solid #d8ccba' }}>
                      <img src="/icons/icon-192.png" alt="Bodyforme" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 9, fontWeight: 500, color: '#2a1506' }}>Bodyforme</div>
                        <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 7, color: '#a08568', marginTop: 2 }}>bodyforme.com.au</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 7.5, color: '#a08568', marginTop: 10, lineHeight: 1.5 }}>An icon will be added to your Home Screen so you can quickly access this website.</div>
                  </div>
                </MockPhone>
              </Step>
              <Step num="5" title="Open Bodyforme any time." body="The app icon now sits on your home screen. Tap it to launch — the browser chrome is hidden, just like a regular app." last>
                <MockPhone type="ios"><StatusBar /><HomeGrid highlightIdx={5} /></MockPhone>
              </Step>
            </div>

            {/* Divider */}
            <div style={{ background: '#d8ccba' }} />

            {/* Android column */}
            <div style={{ paddingLeft: 36 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', paddingBottom: 18, borderBottom: '1px solid #d8ccba' }}>
                <h2 style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 38, fontWeight: 400, margin: 0, lineHeight: 1, color: '#2a1506' }}><em style={{ color: '#7a4a2a' }}>Android</em></h2>
                <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 10, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a08568' }}>Use Chrome</div>
              </div>
              <Step num="1" title="Open the link in Chrome." body={<>Type or paste <strong>bodyforme.com.au/app</strong> into Chrome&apos;s address bar. Chrome works best — Samsung Internet and Edge also support installing.</>}>
                <MockPhone type="android"><StatusBar /><ChromeBar android /><WebpagePreview /></MockPhone>
              </Step>
              <Step num="2" title="Open the browser menu." body="Tap the three-dot menu icon in the top-right of Chrome." keytap={<><DotsIcon /> More options</>}>
                <MockPhone type="android"><StatusBar minimal /><ChromeBar android highlightMenu /><WebpagePreview short /></MockPhone>
              </Step>
              <Step num="3" title={<>Choose &ldquo;Install app&rdquo; or &ldquo;Add to Home screen&rdquo;.</>} body="The exact wording depends on your phone. Both options do the same thing.">
                <MockPhone type="android"><StatusBar minimal /><ChromeBar android /><div style={{ opacity: 0.4 }}><WebpagePreview short /></div><AndroidMenu /></MockPhone>
              </Step>
              <Step num="4" title={<>Confirm with &ldquo;Install&rdquo;.</>} body={<>A small dialog will pop up showing the Bodyforme icon. Tap <strong>Install</strong> (or <strong>Add</strong>) to confirm.</>}>
                <MockPhone type="android">
                  <StatusBar minimal />
                  <div style={{ background: '#fdfaf6', borderBottom: '1px solid #d8ccba', padding: '4px 8px 6px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ flex: 1, background: '#ede4d4', borderRadius: 6, padding: '5px 8px', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 8, color: '#2a1506', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', whiteSpace: 'nowrap' }}>🔒 bodyforme.com.au/app</div>
                  </div>
                  <div style={{ opacity: 0.5 }}><WebpagePreview short /></div>
                  <InstallDialog />
                </MockPhone>
              </Step>
              <Step num="5" title="Open Bodyforme any time." body="The Bodyforme icon now sits with your other apps. Tap it to launch — full-screen, no browser bars." last>
                <MockPhone type="android"><StatusBar /><HomeGrid highlightIdx={2} /></MockPhone>
              </Step>
            </div>
          </div>

          {/* Footer */}
          <div className="install-footer">
            <div className="install-footer-text">
              Stuck? Email <em style={{ color: '#7a4a2a', fontStyle: 'italic' }}>info@bodyforme.com.au</em> or call (03) 9850 2221<br />
              or ask at the front desk — we&apos;ll get you sorted in a minute.
            </div>
            <div className="install-footer-meta">
              Bodyforme · Doncaster<br />
              Member App v1.0
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

// ─── Mobile step (simplified layout — no fixed grid columns) ─────────────────

function MobileStep({ num, title, body, keytap, children, last }: {
  num: string
  title: React.ReactNode
  body: React.ReactNode
  keytap?: React.ReactNode
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={`install-step-row${last ? ' last' : ''}`}>
      <div className="install-step-header">
        <span className="install-step-num">{num}</span>
        <h3 className="install-step-title">{title}</h3>
      </div>
      <p className="install-step-body">{body}</p>
      {keytap && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '5px 10px', background: '#ede4d4', border: '1px solid #d8ccba', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: '#2a1506', fontWeight: 500 }}>
          {keytap}
        </div>
      )}
      <div className="install-step-mockup">{children}</div>
    </div>
  )
}

// ─── Desktop step ────────────────────────────────────────────────────────────

function Step({ num, title, body, keytap, children, last }: {
  num: string
  title: React.ReactNode
  body: React.ReactNode
  keytap?: React.ReactNode
  children: React.ReactNode
  last?: boolean
}) {
  return (
    <div className={`install-step-row${last ? ' last' : ''}`}>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 44, fontWeight: 300, color: '#7a4a2a', lineHeight: 1, fontStyle: 'italic' }}>{num}</div>
      <div className="install-step-inner">
        <div>
          <h3 className="install-step-title">{title}</h3>
          <p className="install-step-body">{body}</p>
          {keytap && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '5px 10px', background: '#ede4d4', border: '1px solid #d8ccba', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, color: '#2a1506', fontWeight: 500 }}>
              {keytap}
            </div>
          )}
        </div>
        <div style={{ marginLeft: 'auto' }}>{children}</div>
      </div>
    </div>
  )
}

// ─── Shared sub-components (unchanged) ──────────────────────────────────────

function MockPhone({ type, children }: { type: 'ios' | 'android'; children: React.ReactNode }) {
  return (
    <div style={{ width: 140, height: 246, background: '#000', borderRadius: 22, padding: 4, boxShadow: '0 14px 30px rgba(42,21,6,0.18), 0 0 0 1px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ width: '100%', height: '100%', background: '#f4ede1', borderRadius: 18, overflow: 'hidden', position: 'relative' }}>
        {type === 'ios'     && <div style={{ position: 'absolute', top: 5, left: '50%', transform: 'translateX(-50%)', width: 56, height: 16, background: '#000', borderRadius: 12, zIndex: 30 }} />}
        {type === 'android' && <div style={{ position: 'absolute', top: 7, right: 18, width: 8, height: 8, background: '#000', borderRadius: '50%', zIndex: 30 }} />}
        {children}
      </div>
    </div>
  )
}

function StatusBar({ minimal }: { minimal?: boolean }) {
  if (minimal) return <div style={{ height: 26 }} />
  return (
    <div style={{ height: 26, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '0 12px 5px', fontSize: 8.5, fontWeight: 600, color: '#2a1506', position: 'relative', zIndex: 5 }}>
      <span>9:41</span>
      <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
        <svg width="11" height="7" viewBox="0 0 11 7"><rect x="0" y="4" width="2" height="3" fill="currentColor"/><rect x="3" y="3" width="2" height="4" fill="currentColor"/><rect x="6" y="1.5" width="2" height="5.5" fill="currentColor"/><rect x="9" y="0" width="2" height="7" fill="currentColor"/></svg>
        <svg width="14" height="7" viewBox="0 0 14 7"><rect x="0.5" y="0.5" width="11" height="6" rx="1.5" stroke="currentColor" fill="none"/><rect x="2" y="2" width="8" height="3" fill="currentColor"/></svg>
      </div>
    </div>
  )
}

function ChromeBar({ android, highlightMenu }: { android?: boolean; highlightMenu?: boolean }) {
  return (
    <div style={{ background: '#fdfaf6', borderBottom: '1px solid #d8ccba', padding: '4px 8px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b4e36', flexShrink: 0 }}>
        {android ? <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5h6M5 2L8 5 5 8" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg>
                 : <svg width="10" height="10" viewBox="0 0 10 10"><path d="M7 1L3 5l4 4" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round"/></svg>}
      </div>
      <div style={{ flex: 1, background: '#ede4d4', borderRadius: 6, padding: '5px 8px', fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 8, color: '#2a1506', display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        🔒 bodyforme.com.au/app
      </div>
      <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b4e36', flexShrink: 0, position: 'relative' }}>
        {android
          ? <><svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="2" r="0.9" fill="currentColor"/><circle cx="5" cy="5" r="0.9" fill="currentColor"/><circle cx="5" cy="8" r="0.9" fill="currentColor"/></svg>
              {highlightMenu && <span className="tap-ring" style={{ right: -6, top: -6 }} />}
            </>
          : <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg>
        }
      </div>
    </div>
  )
}

function WebpagePreview({ short }: { short?: boolean }) {
  return (
    <div style={{ padding: '12px 12px 0', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 14, fontStyle: 'italic', color: '#2a1506', lineHeight: 1, marginTop: 6 }}>Body<em style={{ color: '#7a4a2a', fontStyle: 'italic' }}>forme</em></div>
      <div style={{ height: 4, background: '#d8ccba', borderRadius: 2, width: '80%' }} />
      <div style={{ height: 4, background: '#d8ccba', borderRadius: 2, width: '60%' }} />
      {!short && <>
        <div style={{ height: 4, background: '#d8ccba', borderRadius: 2 }} />
        <div style={{ height: 4, background: '#d8ccba', borderRadius: 2, width: '80%' }} />
        <div style={{ marginTop: 6, padding: '5px 0', textAlign: 'center', background: '#2a1506', color: '#f4ede1', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 6.5, fontWeight: 500, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Sign in to book</div>
      </>}
    </div>
  )
}

function IosToolbar({ highlightShare }: { highlightShare?: boolean }) {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 38, background: 'rgba(244,237,225,0.96)', borderTop: '1px solid #d8ccba', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '0 8px 8px', backdropFilter: 'blur(8px)' }}>
      <ToolbarIcon><svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 1L3 5l4 4M7 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round"/></svg></ToolbarIcon>
      <ToolbarIcon style={{ position: 'relative' }}>
        <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 9V2M4 5l3-3 3 3M2 11h10" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {highlightShare && <span className="tap-ring" style={{ left: -3, top: -3 }} />}
      </ToolbarIcon>
      <ToolbarIcon><svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="2" width="10" height="10" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></ToolbarIcon>
      <ToolbarIcon><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2" fill="none"/></svg></ToolbarIcon>
    </div>
  )
}

function ToolbarIcon({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a4a2a', ...style }}>{children}</div>
}

function ShareSheet() {
  return (
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(244,237,225,0.98)', borderRadius: '14px 14px 0 0', padding: '8px 10px 14px', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: 30, height: 3, background: '#d8ccba', margin: '0 auto 8px', borderRadius: 2 }} />
      <SheetRow label="Add Bookmark" icon={<svg width="11" height="11" viewBox="0 0 11 11"><path d="M5.5 1v9M1 5.5h9" stroke="#7a4a2a" strokeWidth="1.2" strokeLinecap="round"/></svg>} />
      <SheetRow label="Add to Reading List" icon={<svg width="11" height="11" viewBox="0 0 11 11"><path d="M2 2h7v7H2z" stroke="#7a4a2a" strokeWidth="1.2" fill="none"/></svg>} />
      <SheetRow label="Add to Home Screen" highlight icon={<svg width="11" height="11" viewBox="0 0 11 11"><rect x="2" y="2" width="7" height="7" stroke="#c4a882" strokeWidth="1.2" fill="none"/><path d="M5.5 4v3M4 5.5h3" stroke="#c4a882" strokeWidth="1.2" strokeLinecap="round"/></svg>} after={<span className="tap-ring" style={{ right: -8, top: '50%', transform: 'translateY(-50%)' }} />} />
      <SheetRow label="Copy" icon={<svg width="11" height="11" viewBox="0 0 11 11"><path d="M3 4l2.5 3L8 4" stroke="#7a4a2a" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>} />
    </div>
  )
}

function SheetRow({ label, icon, highlight, after }: { label: string; icon: React.ReactNode; highlight?: boolean; after?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: highlight ? '#2a1506' : '#fdfaf6', border: highlight ? '1px solid #7a4a2a' : 'none', borderRadius: 8, marginBottom: 4, position: 'relative' }}>
      <div style={{ width: 22, height: 22, background: highlight ? 'rgba(255,255,255,0.1)' : '#ede4d4', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</div>
      <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 8.5, color: highlight ? '#f4ede1' : '#2a1506', fontWeight: highlight ? 500 : 400, flex: 1 }}>{label}</div>
      {after}
    </div>
  )
}

function AndroidMenu() {
  const items = ['New tab', 'Bookmarks', 'History', 'Install app', 'Share…', 'Settings']
  return (
    <div style={{ position: 'absolute', top: 26, right: 6, width: 110, background: '#fdfaf6', border: '1px solid #d8ccba', borderRadius: 6, padding: '4px 0', boxShadow: '0 8px 22px rgba(42,21,6,0.18)' }}>
      {items.map(item => (
        <div key={item} style={{ padding: '5px 10px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 8, color: item === 'Install app' ? '#7a4a2a' : '#2a1506', background: item === 'Install app' ? '#ede4d4' : 'transparent', borderLeft: item === 'Install app' ? '2px solid #7a4a2a' : '2px solid transparent', fontWeight: item === 'Install app' ? 500 : 400, position: 'relative' }}>
          {item}
          {item === 'Install app' && <span className="tap-ring" style={{ right: 0, top: '50%', transform: 'translateY(-50%)' }} />}
        </div>
      ))}
    </div>
  )
}

function InstallDialog() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(42,21,6,0.45)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: '#f4ede1', borderRadius: '14px 14px 0 0', padding: '14px 14px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <img src="/icons/icon-192.png" alt="Bodyforme" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
          <div>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 11, fontWeight: 500, color: '#2a1506' }}>Install Bodyforme</div>
            <div style={{ fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 7, color: '#a08568', marginTop: 1 }}>bodyforme.com.au</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <div style={{ padding: '4px 10px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 7.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', borderRadius: 4, color: '#6b4e36' }}>Cancel</div>
          <div style={{ padding: '4px 10px', fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: 7.5, fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', borderRadius: 4, background: '#2a1506', color: '#f4ede1', position: 'relative', boxShadow: '0 0 0 3px rgba(122,74,42,0.25)' }}>Install<span className="tap-ring" style={{ right: -6, top: -6 }} /></div>
        </div>
      </div>
    </div>
  )
}

function HomeGrid({ highlightIdx }: { highlightIdx: number }) {
  return (
    <div style={{ height: '100%', background: 'linear-gradient(180deg, #ede4d4 0%, #f4ede1 100%)', padding: '36px 14px 14px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px 8px', alignContent: 'start' }}>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} style={{ aspectRatio: '1', position: 'relative' }}>
          {i === highlightIdx
            ? <div style={{ width: '100%', height: '100%', borderRadius: 9, overflow: 'hidden', boxShadow: '0 0 0 2px #7a4a2a, 0 6px 14px rgba(42,21,6,0.25)' }}>
                <img src="/icons/icon-192.png" alt="Bodyforme" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <span className="tap-ring" style={{ right: -6, top: -6 }} />
              </div>
            : <div style={{ width: '100%', height: '100%', background: '#e4d8c6', borderRadius: 9 }} />
          }
        </div>
      ))}
    </div>
  )
}

function ShareIcon() {
  return <svg viewBox="0 0 14 14" width="11" height="11"><path d="M7 9V2M4 5l3-3 3 3M2 11h10" stroke="currentColor" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
}

function DotsIcon() {
  return <svg viewBox="0 0 14 14" width="11" height="11"><circle cx="7" cy="3" r="1.2" fill="currentColor"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/><circle cx="7" cy="11" r="1.2" fill="currentColor"/></svg>
}
