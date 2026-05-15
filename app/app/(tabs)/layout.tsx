import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { SessionProvider } from '@/components/app/SessionProvider'
import TabBar from '@/components/app/TabBar'

export default async function TabsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/app/login')

  return (
    <SessionProvider session={session}>
      <div style={{
        height:         '100dvh',
        display:        'flex',
        flexDirection:  'column',
        background:     '#f4ede1',
        overflow:       'hidden',
      }}>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
        <TabBar />
      </div>
    </SessionProvider>
  )
}
