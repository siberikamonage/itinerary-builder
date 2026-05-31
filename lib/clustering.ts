import { Place, ShanghaiDistrict } from '@/types'
import { DISTRICT_ADJACENCY } from './geocoder'

/**
 * Reorders a day's places so that geographically close places are visited
 * consecutively, minimising unnecessary cross-city travel.
 *
 * Strategy:
 *   1. Group places by district.
 *   2. Order district groups: home district first (if present), then
 *      adjacent districts, then the rest alphabetically.
 *   3. Within each group, sort north-to-south (descending lat) as a
 *      simple proxy for a walkable order.
 */
export function clusterByDistrict(
  places: Place[],
  homeDistrict: ShanghaiDistrict | null
): Place[] {
  if (places.length <= 1) return places

  // Group by district
  const groups = new Map<string, Place[]>()
  for (const place of places) {
    const key = place.district
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(place)
  }

  // Sort within each group north-to-south
  for (const group of groups.values()) {
    group.sort((a, b) => b.lat - a.lat)
  }

  // Rank each district group
  const districtRank = (district: string): number => {
    if (!homeDistrict) return 0
    if (district === homeDistrict) return 2
    if (DISTRICT_ADJACENCY[homeDistrict]?.includes(district as ShanghaiDistrict)) return 1
    return 0
  }

  const orderedDistricts = [...groups.keys()].sort((a, b) => {
    const rankDiff = districtRank(b) - districtRank(a)
    if (rankDiff !== 0) return rankDiff
    return a.localeCompare(b)
  })

  return orderedDistricts.flatMap(d => groups.get(d)!)
}
