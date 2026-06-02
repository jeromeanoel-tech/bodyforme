import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BodyForme Pilates | Doncaster',
  description: 'Premium Pilates studio in Doncaster, Melbourne. Mat, Reformer and Barre classes. Book your free trial today.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
