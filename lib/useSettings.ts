'use client'

import { useState, useEffect, useCallback } from 'react'
import { type AdminSettings, DEFAULT_SETTINGS, SETTINGS_KEY } from './settings'

function load(): AdminSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    setSettings(load())
  }, [])

  const save = useCallback((next: AdminSettings) => {
    setSettings(next)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  }, [])

  const update = useCallback((patch: Partial<AdminSettings>) => {
    setSettings(prev => {
      const next = { ...prev, ...patch }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { settings, save, update }
}
