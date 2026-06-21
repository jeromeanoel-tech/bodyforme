import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { SessionProvider } from '@/components/app/SessionProvider'
import TabBar from '@/components/app/TabBar'
import LiveClock from '@/components/LiveClock'
import MembershipBanner from '@/components/app/MembershipBanner'

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
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '6px 20px', borderBottom: '1px solid #e4d8c6',
          background: '#fdfaf6',
        }}>
          <LiveClock variant="member" />
        </div>
        <MembershipBanner />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
        <TabBar />
      </div>
    </SessionProvider>
  )
}
