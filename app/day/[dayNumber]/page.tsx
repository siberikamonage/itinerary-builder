'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useItinerary } from '@/context/ItineraryContext'
import { PlaceCard } from '@/components/itinerary/PlaceCard'
import { SwapModal } from '@/components/itinerary/SwapModal'
import { ItineraryPlace, Place } from '@/types'

// Leaflet must not render server-side
const DayMap = dynamic(() => import('@/components/map/DayMap'), { ssr: false })

export default function DayViewPage() {
  const router                               = useRouter()
  const { dayNumber }                        = useParams<{ dayNumber: string }>()
  const { itinerary, swapPlace, getSwapOptions } = useItinerary()
  const [swapTarget, setSwapTarget]          = useState<ItineraryPlace | null>(null)

  const dayIndex = parseInt(dayNumber, 10) - 1
  const day      = itinerary?.[dayIndex]

  useEffect(() => {
    if (!itinerary) router.replace('/survey')
  }, [itinerary, router])

  if (!day) return null

  function handleSwap(replacement: Place) {
    if (!swapTarget) return
    swapPlace(dayIndex, swapTarget.id, replacement.id)
    setSwapTarget(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Sticky header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10
                      px-4 py-4 flex items-center gap-3">
        <button
          onClick={() => router.push('/itinerary')}
          className="text-gray-400 text-lg leading-none"
          aria-label="Back to calendar"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-900 flex-1">
          Day {day.dayNumber}
        </h1>
        <span className="text-sm text-gray-400">
          {day.places.length} places
        </span>
      </div>

      {/* Mini map (stub today, real Leaflet on Day 9) */}
      <DayMap places={day.places} />

      {/* Place list */}
      <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto">
        {day.places.map(place => (
          <PlaceCard
            key={place.id}
            place={place}
            onSwap={() => setSwapTarget(place)}
          />
        ))}
      </div>

      {/* Swap modal */}
      {swapTarget && (
        <SwapModal
          place={swapTarget}
          candidates={getSwapOptions(swapTarget)}
          onSwap={handleSwap}
          onClose={() => setSwapTarget(null)}
        />
      )}

    </div>
  )
}
