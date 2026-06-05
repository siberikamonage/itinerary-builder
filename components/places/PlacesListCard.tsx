'use client'

// Compact list card for the virtual list on /places.
// Total rendered height MUST equal the ITEM_SIZE constant in PlacesListClient
// (currently 96px = 80px image + 8px top padding + 8px bottom padding).
// Do not add margins or change padding without updating ITEM_SIZE.

import Link from 'next/link'
import { Place } from '@/types'
import { DistrictPlaceholder } from '@/components/places/DistrictPlaceholder'
import { CATEGORY_ICONS, formatCost, formatDuration } from '@/lib/place-utils'

interface Props {
  place:   Place
  listUrl: string   // current /places?tags=… URL — embedded in detail link for back-nav
}

export function PlacesListCard({ place, listUrl }: Props) {
  const detailUrl = `/places/${place.id}?from=${encodeURIComponent(listUrl)}`

  return (
    <Link href={detailUrl} className="block px-4 active:bg-gray-50 transition-colors">
      {/* Total height: py-2 (8+8) + h-20 image (80) = 96px */}
      <div className="flex gap-3 py-2 items-center">

        {/* Thumbnail — fixed 80×80 */}
        {place.image_url ? (
          <img
            src={place.image_url}
            alt={place.name.en}
            width={80}
            height={80}
            loading="lazy"
            className="w-20 h-20 rounded-xl object-cover shrink-0 bg-gray-100"
          />
        ) : (
          <DistrictPlaceholder
            district={place.district}
            className="w-20 h-20 rounded-xl shrink-0"
          />
        )}

        {/* Text content */}
        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          <p className="font-semibold text-gray-900 text-sm leading-snug truncate">
            {place.name.en}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full leading-tight">
              {place.district}
            </span>
            <span className="text-xs text-gray-500 leading-tight">
              {CATEGORY_ICONS[place.category] ?? '📍'} {place.category}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">
              {formatDuration(place.visit_duration_min)}
            </span>
            <span className="text-xs font-medium text-gray-600">
              {formatCost(place.cost_level)}
            </span>
          </div>
        </div>

        {/* Chevron */}
        <span className="text-gray-300 text-sm shrink-0">›</span>

      </div>
    </Link>
  )
}
