import { ItineraryPlace } from '@/types'

interface Props {
  places: ItineraryPlace[]
}

// Real Leaflet implementation added in Day 9.
// This stub renders a placeholder so the Day View compiles and is testable today.
export default function DayMap({ places }: Props) {
  return (
    <div className="h-52 w-full bg-gray-100 flex items-center justify-center">
      <p className="text-sm text-gray-400">
        🗺️ Map coming Day 9 · {places.length} places
      </p>
    </div>
  )
}
