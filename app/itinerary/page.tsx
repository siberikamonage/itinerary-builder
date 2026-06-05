'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useItinerary } from '@/context/ItineraryContext'
import { DayCard } from '@/components/itinerary/DayCard'

export default function ItineraryPage() {
  const router               = useRouter()
  const { itinerary, preferences, loading, reset } = useItinerary()

  // Redirect to survey if someone lands here directly with no itinerary
  useEffect(() => {
    if (!loading && !itinerary) router.replace('/survey')
  }, [loading, itinerary, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">🗺️</div>
          <p className="text-gray-400 text-sm">Building your itinerary…</p>
        </div>
      </div>
    )
  }

  if (!itinerary || !preferences) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-10 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-900">
          Your {preferences.duration}-Day Shanghai Itinerary
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Tap a day to see the full schedule
        </p>
      </div>

      {/* Day cards */}
      <div className="px-4 py-4 flex flex-col gap-4 max-w-lg mx-auto">
        {itinerary.map(day => (
          <DayCard
            key={day.dayNumber}
            day={day}
            onClick={() => router.push(`/day/${day.dayNumber}`)}
          />
        ))}

        {/* Footer actions */}
        <button
          onClick={() => { reset(); router.push('/') }}
          className="w-full py-4 border-2 border-gray-200 text-gray-400 font-medium
                     rounded-2xl mt-2 active:bg-gray-50 transition-colors text-sm"
        >
          Start over
        </button>

        <Link
          href="/places"
          className="block text-center text-sm text-gray-400 py-2
                     active:text-gray-600 transition-colors"
        >
          Browse all places →
        </Link>
      </div>
    </div>
  )
}
