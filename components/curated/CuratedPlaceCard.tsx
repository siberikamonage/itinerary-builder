import { CuratedPlace } from '@/lib/curated-data'

const CATEGORY_ICONS: Record<string, string> = {
  landmark:   '📍',
  museum:     '🏛️',
  historic:   '🏯',
  shopping:   '🛍️',
  restaurant: '🍜',
  cafe:       '☕',
  bakery:     '🥐',
  art:        '🎨',
  market:     '🏪',
  park:       '🌿',
  attraction: '🎡',
}

const TAG_COLORS: Record<string, string> = {
  culture:          'bg-orange-100 text-orange-700',
  history:          'bg-amber-100 text-amber-700',
  art:              'bg-purple-100 text-purple-700',
  food:             'bg-red-100 text-red-700',
  shopping:         'bg-blue-100 text-blue-700',
  'hidden-gems':    'bg-green-100 text-green-700',
  photography:      'bg-yellow-100 text-yellow-700',
  nightlife:        'bg-slate-100 text-slate-700',
  'family-friendly':'bg-cyan-100 text-cyan-700',
  michelin:         'bg-rose-100 text-rose-700',
  luxury:           'bg-violet-100 text-violet-700',
  local:            'bg-lime-100 text-lime-700',
  nature:           'bg-emerald-100 text-emerald-700',
  architecture:     'bg-indigo-100 text-indigo-700',
  cafe:             'bg-brown-100 text-yellow-800',
  youth:            'bg-pink-100 text-pink-700',
}

interface Props {
  place: CuratedPlace
  index: number
}

export function CuratedPlaceCard({ place, index }: Props) {
  const icon = CATEGORY_ICONS[place.category] ?? '📍'

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-4 flex flex-col gap-3">

        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0 mt-0.5">{icon}</span>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 leading-snug">{place.name.en}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{place.name.zh}</p>
          </div>
          <span className="text-xs text-gray-300 shrink-0 mt-1">#{index + 1}</span>
        </div>

        {/* Tags */}
        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {place.tags.map(tag => (
              <span
                key={tag}
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[tag] ?? 'bg-gray-100 text-gray-600'}`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {place.description && (
          <p className="text-sm text-gray-600 leading-relaxed">{place.description}</p>
        )}

        {/* Insider note */}
        {place.notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex gap-2">
            <span className="text-sm shrink-0">💡</span>
            <p className="text-xs text-amber-800 leading-relaxed">{place.notes}</p>
          </div>
        )}

        {/* Address */}
        {place.address && (
          <p className="text-xs text-gray-400 flex items-start gap-1">
            <span className="shrink-0">📌</span>
            <span>{place.address}</span>
          </p>
        )}

      </div>
    </div>
  )
}
