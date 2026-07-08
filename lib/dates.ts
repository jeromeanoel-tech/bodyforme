/**
 * Shared Melbourne timezone utilities.
 * Single source of truth for all date/time conversion in the schedule system.
 * DST-safe: uses a live offset probe rather than a hardcoded +10/+11 offset.
 */

const TZ = 'Australia/Melbourne'

/** Returns Melbourne YYYY-MM-DD for a given Date (defaults to now). */
export function getMelbDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
}

/** Returns Melbourne day-of-week: 0=Sun, 1=Mon, …, 6=Sat. */
export function getMelbDow(d: Date = new Date()): number {
  const name = new Intl.DateTimeFormat('en-AU', { timeZone: TZ, weekday: 'long' })
    .format(d).toLowerCase()
  const map: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  }
  return map[name] ?? d.getUTCDay()
}

/**
 * Convert Melbourne 00:00 on a given Melbourne date to a UTC ISO string.
 * DST-safe: probes the actual Melbourne UTC offset for that specific date.
 */
export function melbMidnightToUtc(melbDateStr: string): string {
  // Probe at 02:00 UTC to read back what hour Melbourne thinks it is.
  const probe  = new Date(`${melbDateStr}T02:00:00Z`)
  const melbH  = parseInt(
    new Intl.DateTimeFormat('en-AU', { timeZone: TZ, hour: '2-digit', hour12: false }).format(probe), 10,
  )
  const offsetH = melbH - 2          // 10 = AEST (winter), 11 = AEDT (summer)
  const utcH    = 0 - offsetH        // Melbourne 00:00 expressed in UTC hours
  if (utcH >= 0) {
    return `${melbDateStr}T${String(utcH).padStart(2, '0')}:00:00.000Z`
  }
  // Midnight falls on the previous UTC calendar day
  const prev = new Date(`${melbDateStr}T00:00:00Z`)
  prev.setUTCDate(prev.getUTCDate() - 1)
  return `${prev.toISOString().slice(0, 10)}T${String(24 + utcH).padStart(2, '0')}:00:00.000Z`
}

/**
 * Convert a Melbourne HH:MM time on a Melbourne calendar date to a UTC ISO string.
 * DST-safe: shares the same offset probe as melbMidnightToUtc.
 */
export function melbToUtc(melbDateStr: string, hhmm: string): string {
  const [h, m]  = hhmm.split(':').map(Number)
  const probe   = new Date(`${melbDateStr}T02:00:00Z`)
  const melbH   = parseInt(
    new Intl.DateTimeFormat('en-AU', { timeZone: TZ, hour: '2-digit', hour12: false }).format(probe), 10,
  )
  const offsetH = melbH - 2
  const utcH    = h - offsetH
  if (utcH >= 0) {
    return `${melbDateStr}T${String(utcH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`
  }
  const prev = new Date(`${melbDateStr}T00:00:00Z`)
  prev.setUTCDate(prev.getUTCDate() - 1)
  return `${prev.toISOString().slice(0, 10)}T${String(24 + utcH).padStart(2, '0')}:${String(m).padStart(2, '0')}:00.000Z`
}

/**
 * Returns the Melbourne YYYY-MM-DD string for the Monday of the current week,
 * shifted by offsetWeeks.  Works correctly on both server (UTC) and browser.
 */
export function getMelbWeekMonday(offsetWeeks = 0): string {
  const today      = new Date()
  const todayMelb  = getMelbDate(today)
  const dow        = getMelbDow(today)
  const daysToMon  = (dow - 1 + 7) % 7   // Mon=0, Tue=1, …, Sun=6
  const [y, mo, d] = todayMelb.split('-').map(Number)
  const mon        = new Date(Date.UTC(y, mo - 1, d - daysToMon + offsetWeeks * 7))
  return mon.toISOString().slice(0, 10)
}

/**
 * Returns the exact UTC query bounds for a schedule week.
 *
 * from : Melbourne Monday 00:00 → UTC  (captures all Monday sessions, even pre-10am)
 * to   : Melbourne Sunday 23:59:59.999 → UTC  (= next Melbourne Monday 00:00 minus 1ms)
 *
 * Both sides use melbMidnightToUtc so DST transitions (AEST↔AEDT) are handled correctly.
 */
export function getScheduleWeekRange(offsetWeeks = 0): {
  from: string
  to: string
  melbMonday: string
  melbSunday: string
} {
  const melbMonday    = getMelbWeekMonday(offsetWeeks)
  const [y, mo, d]    = melbMonday.split('-').map(Number)
  const melbNextMon   = new Date(Date.UTC(y, mo - 1, d + 7)).toISOString().slice(0, 10)
  const melbSunday    = new Date(Date.UTC(y, mo - 1, d + 6)).toISOString().slice(0, 10)

  const from          = melbMidnightToUtc(melbMonday)
  const nextMonUtc    = melbMidnightToUtc(melbNextMon)
  const to            = new Date(new Date(nextMonUtc).getTime() - 1).toISOString()

  return { from, to, melbMonday, melbSunday }
}

/**
 * Converts a UTC ISO timestamp to the Melbourne weekday name + HH:MM time.
 * Used for cross-referencing stored sessions against the schedule template.
 */
export function getMelbDayTime(utcIso: string): { day: string; time: string } {
  const d = new Date(utcIso)
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: TZ,
    weekday: 'long',
    hour:    '2-digit',
    minute:  '2-digit',
    hour12:  false,
  }).formatToParts(d)
  const day    = parts.find(p => p.type === 'weekday')?.value?.toLowerCase() ?? ''
  const h      = parts.find(p => p.type === 'hour')?.value   ?? '00'
  const m      = parts.find(p => p.type === 'minute')?.value ?? '00'
  return { day, time: `${h.padStart(2, '0')}:${m.padStart(2, '0')}` }
}

/**
 * Returns the Melbourne YYYY-MM-DD for the first occurrence of a named weekday
 * starting from the current week's Monday (or offsetWeeks ahead).
 *
 * Example: getMelbFirstOccurrence('monday') → this week's Monday.
 *          getMelbFirstOccurrence('wednesday') → this week's Wednesday.
 */
export function getMelbFirstOccurrence(day: string, offsetWeeks = 0): string {
  const DOW: Record<string, number> = {
    sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
    thursday: 4, friday: 5, saturday: 6,
  }
  const targetDow      = DOW[day.toLowerCase().trim()] ?? 1
  const melbMonday     = getMelbWeekMonday(offsetWeeks)
  const [y, mo, d]     = melbMonday.split('-').map(Number)
  // Monday is dow=1; offset from Monday: Mon→0, Tue→1, …, Sun→6
  const daysFromMonday = (targetDow - 1 + 7) % 7
  return new Date(Date.UTC(y, mo - 1, d + daysFromMonday)).toISOString().slice(0, 10)
}
