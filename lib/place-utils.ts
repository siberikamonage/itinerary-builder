import { TripGoal, CostLevel } from '@/types'

// ─── Category icons ────────────────────────────────────────────────────────────
// Covers every PlaceCategory value plus raw names that appear in OSM records.
export const CATEGORY_ICONS: Record<string, string> = {
  museum:       '🏛️',
  historic:     '🏯',
  temple:       '⛩️',
  park:         '🌿',
  restaurant:   '🍜',
  cafe:         '☕',
  bakery:       '🍞',
  shopping:     '🛍️',
  gallery:      '🎨',
  landmark:     '📍',
  market:       '🏪',
  attraction:   '🎡',
  bar:          '🍸',
  viewpoint:    '🌆',
  neighborhood: '🗺️',
}

// ─── Category → map pin hex color (PRD §4 table) ──────────────────────────────
export const CATEGORY_COLORS: Record<string, string> = {
  museum:       '#4A90D9',
  historic:     '#8B6914',
  temple:       '#8B6914',
  park:         '#4CAF50',
  restaurant:   '#E87722',
  cafe:         '#A0522D',
  bakery:       '#E87722',
  shopping:     '#D81B60',
  gallery:      '#7B1FA2',
  landmark:     '#546E7A',
  market:       '#546E7A',
  attraction:   '#00ACC1',
  bar:          '#1A237E',
  nightlife:    '#1A237E',
  viewpoint:    '#546E7A',
  neighborhood: '#546E7A',
}

// ─── Trip goals in tag-bar display order ──────────────────────────────────────
export const TRIP_GOALS: TripGoal[] = [
  'culture-history',
  'food-drink',
  'hidden-gems',
  'shopping',
  'art-museums',
  'family-friendly',
  'nature-parks',
  'nightlife',
]

// ─── Human-readable label for each TripGoal ───────────────────────────────────
export const TRIP_GOAL_LABELS: Record<string, string> = {
  'culture-history': 'Culture & History',
  'food-drink':      'Food & Drink',
  'hidden-gems':     'Hidden Gems',
  'shopping':        'Shopping',
  'art-museums':     'Art & Museums',
  'family-friendly': 'Family-friendly',
  'nature-parks':    'Nature & Parks',
  'nightlife':       'Nightlife',
}

// ─── Cost level → display string ─────────────────────────────────────────────
export function formatCost(level: CostLevel): string {
  return (['Free', '¥', '¥¥', '¥¥¥'] as const)[level] ?? '¥'
}

// ─── Duration minutes → compact string ───────────────────────────────────────
// 45 → "~45 min" | 60 → "~1h" | 90 → "~1h 30min" | 120 → "~2h"
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `~${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m === 0 ? `~${h}h` : `~${h}h ${m}min`
}

// ─── Opening hours formatter ──────────────────────────────────────────────────
// Input:  { mon: "09:00-17:00", tue: "09:00-17:00", wed: "closed", ... }
// Output: [ { day: "Mon–Tue", hours: "09:00-17:00" }, { day: "Wed", hours: "Closed" } ]
// Returns null when input is undefined or has no recognisable entries.
//
// Consecutive days with identical hours are collapsed into a range.
// Days absent from the input record are skipped entirely.

const DAY_ORDER  = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const DAY_LABEL: Record<string, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu',
  fri: 'Fri', sat: 'Sat', sun: 'Sun',
}

export function formatOpeningHours(
  hours?: Record<string, string>
): { day: string; hours: string }[] | null {
  if (!hours || Object.keys(hours).length === 0) return null

  // Normalise: map each known day key to a display string, skip missing keys
  const present = DAY_ORDER.flatMap((key) => {
    if (!(key in hours)) return []
    const raw = hours[key]
    const display = raw.toLowerCase() === 'closed' ? 'Closed' : raw
    return [{ key, display }]
  })

  if (present.length === 0) return null

  // Collapse consecutive days with identical hours into ranges
  const rows: { day: string; hours: string }[] = []
  let i = 0

  while (i < present.length) {
    const { display } = present[i]
    let j = i + 1

    while (j < present.length && present[j].display === display) {
      j++
    }

    const startLabel = DAY_LABEL[present[i].key]
    const endLabel   = DAY_LABEL[present[j - 1].key]
    const dayLabel   = startLabel === endLabel ? startLabel : `${startLabel}–${endLabel}`

    rows.push({ day: dayLabel, hours: display })
    i = j
  }

  return rows.length > 0 ? rows : null
}
