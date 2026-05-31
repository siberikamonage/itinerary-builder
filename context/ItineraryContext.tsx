'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Place, Preferences, Itinerary, Restrictions, TripGoal, ShanghaiDistrict } from '@/types'
import { generateItinerary, getSwapCandidates } from '@/lib/generator'
import { matchHomeDistrict } from '@/lib/geocoder'

// ─── Raw survey inputs (before enrichment into full Preferences) ───────────────
export interface SurveyInputs {
  duration:    number
  homeBase:    string
  goals:       TripGoal[]
  limitations: string
}

interface ItineraryContextValue {
  // Data
  places:      Place[]
  preferences: Preferences | null
  itinerary:   Itinerary | null
  loading:     boolean

  // Actions
  submitSurvey:    (inputs: SurveyInputs) => void
  swapPlace:       (dayIndex: number, oldPlaceId: string, newPlaceId: string) => void
  getSwapOptions:  (place: Place) => Place[]
  reset:           () => void
}

const ItineraryContext = createContext<ItineraryContextValue | null>(null)

export function ItineraryProvider({ children }: { children: ReactNode }) {
  const [places,      setPlaces]      = useState<Place[]>([])
  const [loading,     setLoading]     = useState(true)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [itinerary,   setItinerary]   = useState<Itinerary | null>(null)

  // Load the bundled dataset once on mount
  useEffect(() => {
    fetch('/data/places.json')
      .then(r => r.json())
      .then((data: Place[]) => {
        setPlaces(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function submitSurvey(inputs: SurveyInputs) {
    const homeDistrict = matchHomeDistrict(inputs.homeBase)

    // Restrictions are parsed inside the generator, but we store them here
    // so the context always has the full Preferences object.
    const restrictions: Restrictions = {
      excludeNightlife:      /family|kid|child|children|toddler/.test(inputs.limitations.toLowerCase()),
      deprioritizeExpensive: /budget|cheap|free|affordable|inexpensive/.test(inputs.limitations.toLowerCase()),
    }

    const prefs: Preferences = {
      duration:    inputs.duration,
      homeBase:    inputs.homeBase,
      homeDistrict,
      goals:       inputs.goals,
      limitations: inputs.limitations,
      restrictions,
    }

    const result = generateItinerary(prefs, places)
    setPreferences(prefs)
    setItinerary(result)
  }

  function swapPlace(dayIndex: number, oldPlaceId: string, newPlaceId: string) {
    if (!itinerary) return
    const replacement = places.find(p => p.id === newPlaceId)
    if (!replacement) return

    setItinerary(prev => prev!.map((day, i) => {
      if (i !== dayIndex) return day
      return {
        ...day,
        places: day.places.map(p =>
          p.id === oldPlaceId
            ? { ...replacement, timeSlot: p.timeSlot, dayIndex }
            : p
        ),
      }
    }))
  }

  function getSwapOptions(place: Place): Place[] {
    if (!itinerary || !preferences) return []
    return getSwapCandidates(place, itinerary, places, preferences)
  }

  function reset() {
    setPreferences(null)
    setItinerary(null)
  }

  return (
    <ItineraryContext.Provider
      value={{ places, preferences, itinerary, loading, submitSurvey, swapPlace, getSwapOptions, reset }}
    >
      {children}
    </ItineraryContext.Provider>
  )
}

export function useItinerary(): ItineraryContextValue {
  const ctx = useContext(ItineraryContext)
  if (!ctx) throw new Error('useItinerary must be used inside <ItineraryProvider>')
  return ctx
}
