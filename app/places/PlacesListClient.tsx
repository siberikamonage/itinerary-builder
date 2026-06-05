'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { FixedSizeList, ListChildComponentProps } from 'react-window'
import { usePathname, useSearchParams } from 'next/navigation'
import { usePlacesFilter } from '@/hooks/usePlacesFilter'
import { PlacesListCard } from '@/components/places/PlacesListCard'
import { TRIP_GOALS, TRIP_GOAL_LABELS } from '@/lib/place-utils'
import { TripGoal, Place } from '@/types'

// Leaflet must not run server-side — identical pattern to DayMap usage
const PlacesMap = dynamic(
  () => import('@/components/places/PlacesMap'),
  { ssr: false },
)

// Must match the rendered height of PlacesListCard exactly.
const ITEM_SIZE = 96

// Height of the sticky header (title row + tag bar).
// Used to calculate the available height for the virtual list.
const HEADER_H = 108

export default function PlacesListClient() {
  const pathname = usePathname()
  const params   = useSearchParams()

  const { filtered, activeTags, toggleTag, clearTags, totalCount, filteredCount } =
    usePlacesFilter()

  // List vs map view — local state, not in URL (filters are preserved either way)
  const [view, setView] = useState<'list' | 'map'>('list')

  // Viewport height minus sticky header — recalculated on resize
  const [listHeight, setListHeight] = useState(600)

  useEffect(() => {
    const update = () => setListHeight(window.innerHeight - HEADER_H)
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Current URL passed to each card so the detail page can navigate back here
  const currentUrl = params.toString()
    ? `${pathname}?${params.toString()}`
    : pathname

  // react-window row renderer — must be defined outside JSX to avoid re-mount on every render
  function Row({ index, style }: ListChildComponentProps) {
    return (
      <div style={style}>
        <PlacesListCard place={filtered[index] as Place} listUrl={currentUrl} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Sticky header ───────────────────────────────────────────────────── */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10">

        {/* Title row */}
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Places</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {filteredCount === totalCount
                ? `${totalCount} places`
                : `${filteredCount} of ${totalCount}`}
            </p>
          </div>

          {/* List / Map toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 text-sm">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 font-medium transition-colors
                ${view === 'list' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
            >
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1.5 font-medium transition-colors
                ${view === 'map' ? 'bg-gray-900 text-white' : 'text-gray-500'}`}
            >
              Map
            </button>
          </div>
        </div>

        {/* Tag bar */}
        <div
          className="flex gap-2 px-4 pb-3 overflow-x-auto"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        >
          {/* All pill */}
          <button
            onClick={clearTags}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
              ${activeTags.length === 0
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 active:bg-gray-200'
              }`}
          >
            All
          </button>

          {TRIP_GOALS.map((goal: TripGoal) => (
            <button
              key={goal}
              onClick={() => toggleTag(goal)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                ${activeTags.includes(goal)
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 active:bg-gray-200'
                }`}
            >
              {TRIP_GOAL_LABELS[goal]}
            </button>
          ))}
        </div>

      </div>

      {/* ── Map view ─────────────────────────────────────────────────────────── */}
      {view === 'map' && (
        <PlacesMap places={filtered} listUrl={currentUrl} />
      )}

      {/* ── List view ────────────────────────────────────────────────────────── */}
      {view === 'list' && (
        filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center px-6">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-gray-500 font-medium">No places match these filters</p>
            <button onClick={clearTags} className="mt-3 text-sm text-red-500">
              Clear filters
            </button>
          </div>
        ) : (
          <FixedSizeList
            height={listHeight}
            itemCount={filtered.length}
            itemSize={ITEM_SIZE}
            width="100%"
            overscanCount={5}
          >
            {Row}
          </FixedSizeList>
        )
      )}

    </div>
  )
}
