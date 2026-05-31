import {
  Place, Preferences, Restrictions,
  Itinerary, Day, ItineraryPlace, TimeSlot,
} from '@/types'
import { scorePlace } from './scorer'
import { clusterByDistrict } from './clustering'

const TARGET_PER_DAY = 5
const MIN_PER_DAY    = 3
const MAX_PER_DAY    = 6

// ─── Parse the free-text limitations field into structured flags ───────────────
function parseRestrictions(limitations: string): Restrictions {
  const lower = limitations.toLowerCase()
  return {
    excludeNightlife:       /family|kid|child|children|toddler/.test(lower),
    deprioritizeExpensive:  /budget|cheap|free|affordable|inexpensive/.test(lower),
  }
}

// ─── Assign Morning / Afternoon / Evening based on position in the day ────────
function assignTimeSlots(places: Place[], dayIndex: number): ItineraryPlace[] {
  const SLOTS: TimeSlot[] = ['Morning', 'Morning', 'Afternoon', 'Afternoon', 'Evening', 'Evening']
  return places.map((place, i) => ({
    ...place,
    timeSlot: SLOTS[i] ?? 'Evening',
    dayIndex,
  }))
}

// ─── Main itinerary generator ─────────────────────────────────────────────────
export function generateItinerary(
  prefs: Preferences,
  allPlaces: Place[]
): Itinerary {
  const restrictions = parseRestrictions(prefs.limitations)
  const fullPrefs: Preferences = { ...prefs, restrictions }

  // Step 1 — Filter to places that match at least one selected goal
  let eligible = allPlaces.filter(place => {
    const hasGoalMatch = place.tags.some(t => fullPrefs.goals.includes(t))
    const notExcluded  = !(restrictions.excludeNightlife && place.category === 'bar')
    return hasGoalMatch && notExcluded
  })

  // Fallback: if nothing matches (very narrow goals), use all places
  if (eligible.length === 0) eligible = [...allPlaces]

  // Step 2 — Determine places-per-day based on what's available
  const totalNeeded  = prefs.duration * TARGET_PER_DAY
  const actualPerDay = Math.max(
    MIN_PER_DAY,
    Math.min(MAX_PER_DAY, Math.floor(Math.min(eligible.length, totalNeeded) / prefs.duration))
  )

  // Step 3 — Build each day's place list
  const usedIds = new Set<string>()
  const days: Day[] = []

  for (let dayIndex = 0; dayIndex < prefs.duration; dayIndex++) {
    // Score remaining eligible places for this day
    const candidates = eligible
      .filter(p => !usedIds.has(p.id))
      .map(p => ({ place: p, score: scorePlace(p, fullPrefs, dayIndex) }))
      .sort((a, b) => b.score - a.score)

    // Take top candidates (3× target so clustering has room to pick)
    const pool = candidates.slice(0, actualPerDay * 3).map(c => c.place)

    // Cluster by neighbourhood, then take the target count
    const clustered = clusterByDistrict(pool, fullPrefs.homeDistrict).slice(0, actualPerDay)

    // Mark as used so they can't appear on another day
    clustered.forEach(p => usedIds.add(p.id))

    days.push({
      dayNumber: dayIndex + 1,
      places:    assignTimeSlots(clustered, dayIndex),
    })
  }

  return days
}

// ─── Swap candidates ──────────────────────────────────────────────────────────
/**
 * Returns up to 3 replacement places for the given place.
 * Candidates must:
 *   - not already be in the itinerary
 *   - share at least one tag with the place being swapped out
 * Results are sorted by score so the best alternatives appear first.
 */
export function getSwapCandidates(
  targetPlace: Place,
  currentItinerary: Itinerary,
  allPlaces: Place[],
  prefs: Preferences
): Place[] {
  const usedIds = new Set(
    currentItinerary.flatMap(day => day.places.map(p => p.id))
  )
  // The place being swapped is still in the itinerary at call time — exclude it
  usedIds.delete(targetPlace.id)

  return allPlaces
    .filter(p => !usedIds.has(p.id))
    .filter(p => p.id !== targetPlace.id)
    .filter(p => p.tags.some(t => targetPlace.tags.includes(t)))
    .map(p => ({ place: p, score: scorePlace(p, prefs, 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(s => s.place)
}
