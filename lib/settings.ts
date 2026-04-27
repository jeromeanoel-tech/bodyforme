export type AdminSettings = {
  newMemberDays:        number   // days before "New" badge disappears on clients
  expiringDays:         number   // days until expiry that triggers "Expiring soon"
  insightsDefaultRange: '30d' | '90d' | 'all'
  fillRateWarningPct:   number   // fill rate % below which to show low-fill indicator
  showCancelledClasses: boolean  // show cancelled sessions in schedule view
}

export const DEFAULT_SETTINGS: AdminSettings = {
  newMemberDays:        30,
  expiringDays:         14,
  insightsDefaultRange: '30d',
  fillRateWarningPct:   50,
  showCancelledClasses: false,
}

export const SETTINGS_KEY = 'bf_admin_settings'
