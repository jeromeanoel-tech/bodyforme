import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | BodyForme Pilates',
  description: 'Join BodyForme Pilates in Doncaster. Create your account and choose a membership plan to get started.',
  openGraph: {
    title: 'Sign Up | BodyForme Pilates',
    description: 'Join BodyForme Pilates in Doncaster. Create your account and start booking classes.',
  },
}

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
