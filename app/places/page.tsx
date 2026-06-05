import { Suspense } from 'react'
import PlacesListClient from './PlacesListClient'

// Suspense is required because PlacesListClient uses useSearchParams(),
// which opts the subtree out of static rendering in Next.js App Router.
export default function PlacesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-3 animate-pulse">📍</div>
            <p className="text-gray-400 text-sm">Loading places…</p>
          </div>
        </div>
      }
    >
      <PlacesListClient />
    </Suspense>
  )
}
