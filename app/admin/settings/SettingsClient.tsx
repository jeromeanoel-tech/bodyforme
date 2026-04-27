'use client'

import { useState } from 'react'
import { useSettings } from '@/lib/useSettings'
import type { AdminSettings } from '@/lib/settings'

type Section = 'clients' | 'memberships' | 'schedule' | 'insights'

const NAV: { key: Section; label: string }[] = [
  { key: 'clients',     label: 'Clients' },
  { key: 'memberships', label: 'Memberships' },
  { key: 'schedule',    label: 'Schedule' },
  { key: 'insights',    label: 'Insights' },
]

export default function SettingsClient() {
  const { settings, update } = useSettings()
  const [section, setSection] = useState<Section>('clients')
  const [saved, setSaved]     = useState(false)

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
