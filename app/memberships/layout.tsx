import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Memberships & Pricing | BodyForme Pilates',
  description: 'Flexible Pilates memberships from $45/week. Unlimited, weekly, and class pack options. No lock-in, no joining fee.',
  openGraph: {
    title: 'Memberships & Pricing | BodyForme Pilates',
    description: 'Flexible Pilates memberships from $45/week. No lock-in, no joining fee.',
  },
}

export default function MembershipsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
