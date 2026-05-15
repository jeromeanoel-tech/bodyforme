'use client'

import { createContext, useContext } from 'react'
import type { SessionUser } from '@/lib/session'

const Ctx = createContext<SessionUser | null>(null)

export function SessionProvider({ children, session }: { children: React.ReactNode; session: SessionUser }) {
  return <Ctx.Provider value={session}>{children}</Ctx.Provider>
}

export function useSession(): SessionUser {
  const s = useContext(Ctx)
  if (!s) throw new Error('useSession must be used inside SessionProvider')
  return s
}
