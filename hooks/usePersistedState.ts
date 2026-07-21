'use client'

import { useState, useCallback } from 'react'

/**
 * Drop-in replacement for useState that syncs to sessionStorage.
 * Use this for any UI position state (selected tab, week offset, scroll position)
 * that should survive the user switching between app tabs and coming back.
 *
 * Values are JSON-serialised, so strings, numbers, and simple objects all work.
 * Falls back to defaultValue if sessionStorage is unavailable (SSR, private mode).
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const saved = sessionStorage.getItem(key)
      return saved !== null ? (JSON.parse(saved) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setPersisted = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(prev => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value
        try { sessionStorage.setItem(key, JSON.stringify(next)) } catch {}
        return next
      })
    },
    [key],
  )

  return [state, setPersisted]
}
