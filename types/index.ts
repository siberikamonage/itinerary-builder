// ─── Trip Goal — maps directly to survey multi-select options ─────────────────
export type TripGoal =
  | 'culture-history'
  | 'food-drink'
  | 'shopping'
  | 'nature-parks'
  | 'nightlife'
  | 'art-museums'
  | 'family-friendly'
  | 'hidden-gems'

// ─── Place category — finer-grained than TripGoal ─────────────────────────────
export type PlaceCategory =
  | 'museum'
  | 'temple'
  | 'park'
  | 'restaurant'
  | 'bar'
  | 'market'
  | 'gallery'
  | 'landmark'
  | 'shopping'
  | 'neighborhood'
  | 'viewpoint'

// ─── Shanghai administrative districts ────────────────────────────────────────
export type ShanghaiDistrict =
  | 'Huangpu'
  | 'Xuhui'
  | 'Changning'
  | "Jing'an"
  | 'Putuo'
  | 'Hongkou'
  | 'Yangpu'
  | 'Pudong'
  | 'Minhang'
  | 'Baoshan'
  | 'Jiading'
  | 'Jinshan'
  | 'Songjiang'
  | 'Qingpu'
  | 'Fengxian'
  | 'Chongming'

// ─── Cost level: 0=free, 1=$, 2=$$, 3=$$$ ─────────────────────────────────────
export type CostLevel = 0 | 1 | 2 | 3

// ─── Core place record — matches public/data/places.json schema ───────────────
export interface Place {
  id: string
  name: {
    en: string
    zh: string
  }
  category: PlaceCategory
  tags: TripGoal[]
  district: ShanghaiDistrict
  adjacent_districts?: ShanghaiDistrict[]
  lat: number
  lng: number
  description: string
  visit_duration_min: number
  cost_level: CostLevel
  opening_hours?: Record<string, string>
  image_url?: string
  address?: string
  curated?: boolean
}

// ─── Parsed user restrictions derived from free-text limitations field ─────────
export interface Restrictions {
  excludeNightlife: boolean
  deprioritizeExpensive: boolean
}

// ─── User preferences collected from the survey ───────────────────────────────
export interface Preferences {
  duration: number
  homeBase: string
  homeDistrict: ShanghaiDistrict | null
  goals: TripGoal[]
  limitations: string
  restrictions: Restrictions
}

// ─── Generated itinerary types ────────────────────────────────────────────────
export type TimeSlot = 'Morning' | 'Afternoon' | 'Evening'

export interface ItineraryPlace extends Place {
  timeSlot: TimeSlot
  dayIndex: number
}

export interface Day {
  dayNumber: number  // 1-indexed
  places: ItineraryPlace[]
}

export type Itinerary = Day[]
