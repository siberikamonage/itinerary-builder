import { ItineraryPlace } from '@/types'

const COST_LABELS  = ['Free', '$', '$$', '$$$']
const COST_COLORS  = ['text-green-600', 'text-yellow-600', 'text-orange-500', 'text-red-500']
const COST_BG      = ['bg-green-50',    'bg-yellow-50',    'bg-orange-50',    'bg-red-50']

const SLOT_STYLES: Record<string, string> = {
  Morning:   'bg-orange-100 text-orange-700',
  Afternoon: 'bg-blue-100   text-blue-700',
  Evening:   'bg-purple-100 text-purple-700',
}

const CATEGORY_ICONS: Record<string, string> = {
  museum:       '🏛️',
  gallery:      '🎨',
  temple:       '⛩️',
  park:         '🌿',
  landmark:     '📍',
  viewpoint:    '🌆',
  restaurant:   '🍜',
  bar:          '🍸',
  shopping:     '🛍️',
  market:       '🏪',
  neighborhood: '🗺️',
}

interface Props {
  place:  ItineraryPlace
  onSwap: () => void
}

export function PlaceCard({ place, onSwap }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">

      {/* Cover image */}
      {place.image_url && (
        <div className="h-44 overflow-hidden bg-gray-100">
          <img
            src={place.image_url}
            alt={place.name.en}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4 flex flex-col gap-3">

        {/* Header row: name + time slot badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-gray-900 leading-snug">
              {place.name.en}
            </h3>
            {place.name.zh && place.name.zh !== place.name.en && (
              <p className="text-xs text-gray-400 mt-0.5">{place.name.zh}</p>
            )}
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0
                            ${SLOT_STYLES[place.timeSlot]}`}>
            {place.timeSlot}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
          {place.description}
        </p>

        {/* Meta row: category · duration · cost */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full capitalize flex items-center gap-1">
            {CATEGORY_ICONS[place.category] ?? '📍'} {place.category}
          </span>
          <span className="text-xs text-gray-400">
            ⏱ ~{place.visit_duration_min} min
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full
                            ${COST_COLORS[place.cost_level]} ${COST_BG[place.cost_level]}`}>
            {COST_LABELS[place.cost_level]}
          </span>
        </div>

        {/* Swap button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={onSwap}
            className="text-xs text-gray-500 border border-gray-200 px-4 py-2 rounded-xl
                       hover:border-red-300 hover:text-red-500 active:bg-red-50 transition-colors"
          >
            Swap place
          </button>
        </div>

      </div>
    </div>
  )
}
