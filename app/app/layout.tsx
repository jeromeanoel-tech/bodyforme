import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'BodyForme',
  description: 'Book classes and manage your membership.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable:          true,
    title:            'BodyForme',
    statusBarStyle:   'black-translucent',
  },
  icons: {
    apple: '/icons/app-icon.png',
    icon:  '/icons/app-icon.png',
  },
}

export const viewport: Viewport = {
  width:               'device-width',
  initialScale:        1,
  viewportFit:         'cover',
  themeColor:          '#2a1506',
}

export default function AppRootLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
