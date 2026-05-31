import { Day } from '@/types'

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

// Gradient fallbacks by day number so cards without images still look distinct
const DAY_GRADIENTS = [
  'from-red-400 to-orange-400',
  'from-blue-400 to-cyan-400',
  'from-violet-400 to-purple-400',
  'from-emerald-400 to-teal-400',
  'from-amber-400 to-yellow-400',
  'from-rose-400 to-pink-400',
  'from-indigo-400 to-blue-400',
  'from-lime-400 to-green-400',
]

interface Props {
  day:     Day
  onClick: () => void
}

export function DayCard({ day, onClick }: Props) {
  const cover       = day.places.find(p => p.image_url)
  const previewNames = day.places.slice(0, 3).map(p => p.name.en)
  const gradient    = DAY_GRADIENTS[(day.dayNumber - 1) % DAY_GRADIENTS.length]

  return (
    <button
      onClick={onClick}
      className="w-full bg-white border border-gray-100 rounded-2xl overflow-hidden
                 shadow-sm active:scale-95 transition-transform text-left"
    >
      {/* Thumbnail */}
      {cover?.image_url ? (
        <div className="h-36 overflow-hidden bg-gray-100">
          <img
            src={cover.image_url}
            alt={cover.name.en}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className={`h-36 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
          <span className="text-5xl opacity-80">
            {CATEGORY_ICONS[day.places[0]?.category] ?? '🗺️'}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-gray-900">Day {day.dayNumber}</h3>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
            {day.places.length} places
          </span>
        </div>

        <div className="flex flex-col gap-1">
          {previewNames.map((name, i) => (
            <p key={i} className="text-sm text-gray-600 truncate">
              · {name}
            </p>
          ))}
          {day.places.length > 3 && (
            <p className="text-xs text-gray-400">
              +{day.places.length - 3} more
            </p>
          )}
        </div>
      </div>
    </button>
  )
}
