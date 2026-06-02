import { Suspense } from 'react'
import PosClient from './PosClient'

export const dynamic = 'force-dynamic'

export default function PosPage() {
  return (
    <Suspense>
      <PosClient />
    </Suspense>
  )
}
