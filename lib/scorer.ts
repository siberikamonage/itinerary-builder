import { Place, Preferences, ShanghaiDistrict } from '@/types'
import { DISTRICT_ADJACENCY } from './geocoder'

/**
 * Scores a single place against the user's preferences.
 * Higher score = better fit for this user on this day.
 *
 * Components:
 *   +2 per matching TripGoal tag
 *   −3 / −1 cost penalty when user wants budget options
 *   +2 / +1 proximity bonus on Day 1 (home district / adjacent)
 */
export function scorePlace(
  place: Place,
  prefs: Preferences,
  dayIndex: number
): number {
  let score = 0

  // ── Tag match: +2 per goal that this place satisfies ────────────────────────
  for (const tag of place.tags) {
    if (prefs.goals.includes(tag)) score += 2
  }

  // ── Cost penalty when user indicated budget constraints ──────────────────────
  if (prefs.restrictions.deprioritizeExpensive) {
    if (place.cost_level === 3) score -= 3
    if (place.cost_level === 2) score -= 1
  }

  // ── Day 1 proximity bonus: favour places near the hotel ─────────────────────
  if (dayIndex === 0 && prefs.homeDistrict) {
    const home: ShanghaiDistrict = prefs.homeDistrict
    if (place.district === home) {
      score += 2
    } else if (DISTRICT_ADJACENCY[home]?.includes(place.district)) {
      score += 1
    }
  }

  return score
}
