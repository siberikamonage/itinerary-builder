'use client'

import { Suspense }           from 'react'
import dynamic                from 'next/dynamic'
import Link                   from 'next/link'
import { useSearchParams }    from 'next/navigation'
import { Place }              from '@/types'
import { DistrictPlaceholder } from '@/components/places/DistrictPlaceholder'
import {
  CATEGORY_ICONS,
  TRIP_GOAL_LABELS,
  formatCost,
  formatDuration,
  formatOpeningHours,
} from '@/lib/place-utils'

// Leaflet must not run server-side
const PlaceMiniMap = dynamic(
  () => import('@/components/places/PlaceMiniMap'),
  { ssr: false },
)

// ─── Back button — uses useSearchParams so needs its own Suspense ─────────────
function BackButton() {
  const params  = useSearchParams()
  const backUrl = params.get('from') ?? '/places'
  return (
    <Link
      href={backUrl}
      className="flex items-center gap-1 text-gray-500 text-sm font-medium
                 active:text-gray-900 transition-colors p-1 -ml-1"
    >
      ← Back
    </Link>
  )
}

interface Props { place: Place }

export default function PlaceDetailClient({ place }: Props) {
  const hours   = formatOpeningHours(place.opening_hours)
  const mapsUrl = (place.lat && place.lng)
    ? `https://maps.google.com/?q=${place.lat},${place.lng}`
    : `https://maps.google.com/?q=${encodeURIComponent(place.name.en + ' Shanghai')}`

  return (
    <div className="min-h-screen bg-white pb-24">

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10
                      flex items-center justify-between px-4 py-3.5">
        <Suspense
          fallback={
            <span className="text-gray-500 text-sm font-medium">← Back</span>
          }
        >
          <BackButton />
        </Suspense>

        <Link
          href="/survey"
          className="text-sm font-semibold bg-red-500 text-white
                     px-4 py-1.5 rounded-full active:bg-red-600 transition-colors"
        >
          Add to trip
        </Link>
      </div>

      {/* ── 1. Hero image ────────────────────────────────────────────────────── */}
      {place.image_url ? (
        <img
          src={place.image_url}
          alt={place.name.en}
          className="w-full h-56 object-cover bg-gray-100"
        />
      ) : (
        <DistrictPlaceholder
          district={place.district}
          className="w-full h-56"
        />
      )}

      <div className="px-4 py-5 flex flex-col gap-5 max-w-lg mx-auto">

        {/* ── 2. Name block ──────────────────────────────────────────────────── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">
            {place.name.en}
          </h1>
          {place.name.zh && place.name.zh !== place.name.en && (
            <p className="text-base text-gray-400 mt-1">{place.name.zh}</p>
          )}
        </div>

        {/* ── 3. Meta row ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full font-medium">
            {place.district}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full capitalize">
            {CATEGORY_ICONS[place.category] ?? '📍'} {place.category}
          </span>
          <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-semibold">
            {formatCost(place.cost_level)}
          </span>
          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1.5 rounded-full">
            {formatDuration(place.visit_duration_min)}
          </span>
        </div>

        {/* ── 4. Tag chips — each routes back to filtered list ──────────────── */}
        <div className="flex flex-wrap gap-2">
          {place.tags.map(tag => (
            <Link
              key={tag}
              href={`/places?tags=${tag}`}
              className="text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-full
                         font-medium active:bg-red-100 transition-colors"
            >
              {TRIP_GOAL_LABELS[tag] ?? tag}
            </Link>
          ))}
        </div>

        {/* ── 5. Description ────────────────────────────────────────────────── */}
        <p className="text-sm text-gray-700 leading-relaxed">
          {place.description}
        </p>

        {/* ── 6. Opening hours ──────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-2">
            Opening Hours
          </h2>
          {hours ? (
            <dl className="text-sm divide-y divide-gray-50 border border-gray-100 rounded-xl overflow-hidden">
              {hours.map(({ day, hours: h }) => (
                <div key={day} className="flex justify-between px-3 py-2.5 bg-white">
                  <dt className="text-gray-500 w-24 shrink-0">{day}</dt>
                  <dd className={h === 'Closed' ? 'text-gray-300' : 'text-gray-800 font-medium'}>
                    {h}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-gray-400 italic">Hours not available</p>
          )}
        </div>

        {/* ── 7. Address ────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Address</h2>
          {place.address ? (
            <p className="text-sm text-gray-600 leading-relaxed">{place.address}</p>
          ) : (
            <p className="text-sm text-gray-400">{place.district} District, Shanghai</p>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-red-500
                       font-medium mt-2 active:text-red-700 transition-colors"
          >
            Open in Maps →
          </a>
        </div>

        {/* ── 8. Mini-map ───────────────────────────────────────────────────── */}
        {place.lat && place.lng && (
          <div className="rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <PlaceMiniMap lat={place.lat} lng={place.lng} name={place.name.en} />
          </div>
        )}

      </div>
    </div>
  )
}
