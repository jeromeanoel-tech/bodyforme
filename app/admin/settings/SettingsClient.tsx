'use client'

import { useState } from 'react'
import { useSettings } from '@/lib/useSettings'
import type { AdminSettings } from '@/lib/settings'

type Section = 'clients' | 'memberships' | 'schedule' | 'insights' | 'data'

const NAV: { key: Section; label: string }[] = [
  { key: 'clients',     label: 'Clients' },
  { key: 'memberships', label: 'Memberships' },
  { key: 'schedule',    label: 'Schedule' },
  { key: 'insights',    label: 'Insights' },
  { key: 'data',        label: 'Data' },
]

type ImportState = 'idle' | 'running' | 'done' | 'error'
type ImportResult = { summary: { created: number; updated: number; skipped: number; errors: number; total: number }; results: { name: string; status: string; error?: string }[] }
type OnboardState = 'idle' | 'confirming' | 'sending' | 'done' | 'error'
type OnboardResult = { sent: number; failed: number; total: number; results: { email: string; ok: boolean; error?: string }[] }
type CleanupState = 'idle' | 'confirming' | 'running' | 'done' | 'error'
type PosSetupState = 'idle' | 'running' | 'done' | 'error'
type PosSetupResult = { created: number; skipped: number; results: { name: string; status: string }[] }

export default function SettingsClient() {
  const { settings, update } = useSettings()
  const [section, setSection]       = useState<Section>('clients')
  const [saved, setSaved]           = useState(false)
  const [importState, setImportState] = useState<ImportState>('idle')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError]   = useState('')
  const [onboardState, setOnboardState]   = useState<OnboardState>('idle')
  const [onboardResult, setOnboardResult] = useState<OnboardResult | null>(null)
  const [cleanupState, setCleanupState]   = useState<CleanupState>('idle')
  const [cleanupCount, setCleanupCount]   = useState<number | null>(null)
  const [posState,     setPosState]       = useState<PosSetupState>('idle')
  const [posResult,    setPosResult]      = useState<PosSetupResult | null>(null)

  async function runCleanup() {
    setCleanupState('running')
    try {
      const res  = await fetch('/api/admin/cleanup-members?purge-test=1', { method: 'DELETE' })
      const data = await res.json()
      setCleanupCount(data.deleted ?? 0)
      setCleanupState('done')
    } catch {
      setCleanupState('error')
    }
  }

  async function setupPosProducts() {
    setPosState('running')
    setPosResult(null)
    try {
      const res  = await fetch('/api/admin/setup-pos-products', { method: 'POST' })
      const data: PosSetupResult = await res.json()
      setPosResult(data)
      setPosState('done')
    } catch {
      setPosState('error')
    }
  }

  async function sendOnboardingEmails() {
    setOnboardState('sending')
    try {
      const res = await fetch('/api/admin/send-onboarding', { method: 'POST' })
      const data: OnboardResult = await res.json()
      setOnboardResult(data)
      setOnboardState(data.failed > 0 ? 'error' : 'done')
    } catch (e) {
      setOnboardResult(null)
      setOnboardState('error')
    }
  }

  async function runImport(force = false) {
    setImportState('running')
    setImportResult(null)
    setImportError('')
    try {
      const res = await fetch(`/api/admin/import-members${force ? '?force=1' : ''}`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setImportError(data.error ?? 'Import failed')
        setImportState('error')
      } else {
        setImportResult(data)
        setImportState('done')
      }
    } catch (e) {
      setImportError(String(e))
      setImportState('error')
    }
  }

  function set<K extends keyof AdminSettings>(key: K, val: AdminSettings[K]) {
    update({ [key]: val })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="h-full flex overflow-hidden">

      {/* Section nav */}
      <div className="w-48 shrink-0 border-r border-neutral-200 px-3 py-4 space-y-0.5">
        {NAV.map(n => (
          <button
            key={n.key}
            onClick={() => setSection(n.key)}
            className={`w-full text-left px-3 py-2 rounded-lg text-[13px] transition-colors ${
              section === n.key
                ? 'bg-black text-white font-medium'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-2xl">

        {/* Toast */}
        {saved && (
          <div className="fixed top-4 right-4 z-50 bg-black text-white text-[12.5px] font-medium px-4 py-2 rounded-lg shadow-lg">
            Settings saved
          </div>
        )}

        {/* ── Clients ── */}
        {section === 'clients' && (
          <div className="space-y-6">
            <Heading title="Client settings" sub="Controls how clients are displayed and tagged" />

            <SettingRow
              label="New member badge duration"
              sub={`Clients who joined within this many days show a "New" badge`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.newMemberDays}
                  onChange={e => set('newMemberDays', Number(e.target.value))}
                  className="w-20 h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black text-center"
                />
                <span className="text-[13px] text-neutral-500">days</span>
              </div>
            </SettingRow>
          </div>
        )}

        {/* ── Memberships ── */}
        {section === 'memberships' && (
          <div className="space-y-6">
            <Heading title="Membership settings" sub="Controls alerts and thresholds in the memberships view" />

            <SettingRow
              label="Expiring soon threshold"
              sub="Memberships expiring within this many days show an expiry warning"
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={settings.expiringDays}
                  onChange={e => set('expiringDays', Number(e.target.value))}
                  className="w-20 h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black text-center"
                />
                <span className="text-[13px] text-neutral-500">days</span>
              </div>
            </SettingRow>
          </div>
        )}

        {/* ── Schedule ── */}
        {section === 'schedule' && (
          <div className="space-y-6">
            <Heading title="Schedule settings" sub="Controls which sessions appear in the class schedule" />

            <SettingRow
              label="Show cancelled classes"
              sub="Include sessions with a cancelled status in the schedule view"
            >
              <Toggle
                checked={settings.showCancelledClasses}
                onChange={v => set('showCancelledClasses', v)}
              />
            </SettingRow>
          </div>
        )}

        {/* ── Data ── */}
        {section === 'data' && (
          <div className="space-y-6">
            <Heading title="Data" sub="One-time data imports and migrations" />

            <div className="py-1 space-y-3">
              <div>
                <p className="text-[13.5px] font-medium text-neutral-800">Import Mind Body members</p>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  Imports 57 members from the Mind Body export into the members and memberships tables.
                  Safe to run once — skips if more than 5 members already exist.
                </p>
              </div>

              {importState === 'idle' && (
                <button
                  onClick={() => runImport(false)}
                  className="h-9 px-4 text-[13px] bg-black text-white rounded-lg hover:bg-neutral-800"
                >
                  Run import
                </button>
              )}

              {importState === 'running' && (
                <div className="flex items-center gap-2 text-[13px] text-neutral-500">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full" />
                  Importing members…
                </div>
              )}

              {importState === 'error' && (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-[13px] text-amber-800">
                    {importError}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => runImport(true)}
                      className="h-9 px-4 text-[13px] bg-black text-white rounded-lg hover:bg-neutral-800"
                    >
                      Force import (update existing)
                    </button>
                    <button onClick={() => setImportState('idle')} className="text-[12px] text-neutral-500 underline">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {importState === 'done' && importResult && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-[13px] text-green-700 flex gap-4">
                      <span><strong>{importResult.summary.created}</strong> created</span>
                      <span><strong>{importResult.summary.updated}</strong> updated</span>
                      <span><strong>{importResult.summary.skipped}</strong> skipped</span>
                      {importResult.summary.errors > 0 && (
                        <span className="text-red-600"><strong>{importResult.summary.errors}</strong> errors</span>
                      )}
                    </div>
                  </div>
                  {importResult.results.filter(r => r.status === 'error').map((r, i) => (
                    <p key={i} className="text-[12px] text-red-600">{r.name}: {r.error}</p>
                  ))}
                  <button
                    onClick={() => runImport(true)}
                    className="text-[12px] text-neutral-500 underline"
                  >
                    Re-run with force (updates existing records)
                  </button>
                </div>
              )}
            </div>
            {/* ── Onboarding emails ── */}
            <div className="border-t border-neutral-100 pt-6 space-y-3">
              <div>
                <p className="text-[13.5px] font-medium text-neutral-800">Send member onboarding emails</p>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  Sends the &ldquo;get started in three steps&rdquo; email to all members with a real email address.
                  Covers: creating an account, adding to home screen, and setting up direct debit.
                  Rate-limited to ~1.5/sec to stay within Resend limits.
                </p>
              </div>

              {onboardState === 'idle' && (
                <button
                  onClick={() => setOnboardState('confirming')}
                  className="h-9 px-4 text-[13px] bg-black text-white rounded-lg hover:bg-neutral-800"
                >
                  Send onboarding emails
                </button>
              )}

              {onboardState === 'confirming' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 space-y-3">
                  <p className="text-[13px] text-amber-800">
                    This will send the onboarding email to every member who has a real email address. Are you sure?
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={sendOnboardingEmails}
                      className="h-8 px-4 text-[12.5px] bg-black text-white rounded-lg hover:bg-neutral-800"
                    >
                      Yes, send emails
                    </button>
                    <button onClick={() => setOnboardState('idle')} className="text-[12px] text-neutral-500 underline">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {onboardState === 'sending' && (
                <div className="flex items-center gap-2 text-[13px] text-neutral-500">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full" />
                  Sending emails… this can take a couple of minutes
                </div>
              )}

              {(onboardState === 'done' || onboardState === 'error') && onboardResult && (
                <div className="space-y-2">
                  <div className={`border rounded-lg px-4 py-3 text-[13px] flex gap-4 ${onboardResult.failed > 0 ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    <span><strong>{onboardResult.sent}</strong> sent</span>
                    {onboardResult.failed > 0 && <span className="text-red-600"><strong>{onboardResult.failed}</strong> failed</span>}
                    <span className="text-neutral-400">of {onboardResult.total} total</span>
                  </div>
                  {onboardResult.results.filter(r => !r.ok).map((r, i) => (
                    <p key={i} className="text-[12px] text-red-600">{r.email}: {r.error}</p>
                  ))}
                  <button onClick={() => setOnboardState('idle')} className="text-[12px] text-neutral-500 underline">
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* ── POS products ── */}
            <div className="border-t border-neutral-100 pt-6 space-y-3">
              <div>
                <p className="text-[13.5px] font-medium text-neutral-800">Set up POS products in Stripe</p>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  Creates the 8 standard products in your Stripe account (Casual, class packs, prepaid unlimited)
                  so they appear in the POS panel. Safe to run more than once — skips products that already exist.
                </p>
              </div>
              {posState === 'idle' && (
                <button onClick={setupPosProducts} className="h-9 px-4 text-[13px] bg-black text-white rounded-lg hover:bg-neutral-800">
                  Create POS products
                </button>
              )}
              {posState === 'running' && (
                <div className="flex items-center gap-2 text-[13px] text-neutral-500">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full" />
                  Creating products in Stripe…
                </div>
              )}
              {posState === 'done' && posResult && (
                <div className="space-y-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-[13px] text-green-700 flex gap-4">
                    <span><strong>{posResult.created}</strong> created</span>
                    {posResult.skipped > 0 && <span className="text-neutral-500"><strong>{posResult.skipped}</strong> already existed</span>}
                  </div>
                  {posResult.results.map((r, i) => (
                    <p key={i} className="text-[12px] text-neutral-500">{r.name} — {r.status}</p>
                  ))}
                </div>
              )}
              {posState === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700 space-y-2">
                  <p>Something went wrong. Check that your Stripe key is configured on Vercel.</p>
                  <button onClick={() => setPosState('idle')} className="text-[12px] underline">Try again</button>
                </div>
              )}
            </div>

            {/* ── Test account cleanup ── */}
            <div className="border-t border-neutral-100 pt-6 space-y-3">
              <div>
                <p className="text-[13.5px] font-medium text-neutral-800">Remove test accounts</p>
                <p className="text-[12px] text-neutral-400 mt-0.5">
                  Deletes any member account that isn&apos;t in the real member list and isn&apos;t a placeholder.
                  This removes any test logins created during setup. Cannot be undone.
                </p>
              </div>
              {cleanupState === 'idle' && (
                <button
                  onClick={() => setCleanupState('confirming')}
                  className="h-9 px-4 text-[13px] border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                >
                  Remove test accounts
                </button>
              )}
              {cleanupState === 'confirming' && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 space-y-3">
                  <p className="text-[13px] text-red-800">This will permanently delete test accounts. Are you sure?</p>
                  <div className="flex items-center gap-3">
                    <button onClick={runCleanup} className="h-8 px-4 text-[12.5px] bg-red-600 text-white rounded-lg hover:bg-red-700">
                      Yes, delete them
                    </button>
                    <button onClick={() => setCleanupState('idle')} className="text-[12px] text-neutral-500 underline">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {cleanupState === 'running' && (
                <div className="flex items-center gap-2 text-[13px] text-neutral-500">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full" />
                  Removing accounts…
                </div>
              )}
              {cleanupState === 'done' && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-[13px] text-green-700">
                  Done — <strong>{cleanupCount}</strong> test account{cleanupCount !== 1 ? 's' : ''} removed.
                </div>
              )}
              {cleanupState === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-[13px] text-red-700 space-y-2">
                  <p>Something went wrong. Try again or check the server logs.</p>
                  <button onClick={() => setCleanupState('idle')} className="text-[12px] underline">Try again</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Insights ── */}
        {section === 'insights' && (
          <div className="space-y-6">
            <Heading title="Insights settings" sub="Controls defaults and thresholds in the Insights page" />

            <SettingRow
              label="Default date range"
              sub="The date range selected when you first open Insights"
            >
              <select
                value={settings.insightsDefaultRange}
                onChange={e => set('insightsDefaultRange', e.target.value as AdminSettings['insightsDefaultRange'])}
                className="h-8 px-2 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black bg-white text-neutral-700"
              >
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </SettingRow>

            <SettingRow
              label="Low fill rate threshold"
              sub="Fill rate below this value shows a muted bar indicator in Class performance"
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.fillRateWarningPct}
                  onChange={e => set('fillRateWarningPct', Number(e.target.value))}
                  className="w-20 h-8 px-3 text-sm border border-neutral-200 rounded-lg outline-none focus:border-black text-center"
                />
                <span className="text-[13px] text-neutral-500">%</span>
              </div>
            </SettingRow>
          </div>
        )}

      </div>
    </div>
  )
}

// ── Primitives ────────────────────────────────────────────────────────────────

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="border-b border-neutral-100 pb-4">
      <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>
      <p className="text-[12.5px] text-neutral-400 mt-0.5">{sub}</p>
    </div>
  )
}

function SettingRow({ label, sub, children }: { label: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-1">
      <div className="flex-1">
        <p className="text-[13.5px] font-medium text-neutral-800">{label}</p>
        <p className="text-[12px] text-neutral-400 mt-0.5">{sub}</p>
      </div>
      <div className="shrink-0 pt-0.5">{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-black' : 'bg-neutral-200'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </button>
  )
}
