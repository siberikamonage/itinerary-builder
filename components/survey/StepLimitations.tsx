'use client'

const MAX_CHARS = 500

const EXAMPLES = [
  'Traveling with a 4-year-old',
  'Vegetarian only',
  'Tight budget',
  'Limited walking due to knee issues',
]

interface Props {
  value:    string
  onChange: (v: string) => void
  onSubmit: () => void
  onBack:   () => void
}

export function StepLimitations({ value, onChange, onSubmit, onBack }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="text-gray-400 text-sm self-start">
        ← Back
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Anything we should know?</h2>
        <p className="text-gray-400 mt-2 text-sm">
          Optional — dietary needs, budget, mobility, kids, etc.
          We'll tailor the itinerary around it.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <textarea
          value={value}
          onChange={e => onChange(e.target.value.slice(0, MAX_CHARS))}
          rows={4}
          placeholder="e.g. vegetarian, traveling with kids, tight budget…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base
                     focus:outline-none focus:border-red-400 transition-colors
                     resize-none leading-relaxed"
        />
        <p className="text-xs text-gray-300 text-right">
          {value.length} / {MAX_CHARS}
        </p>
      </div>

      {/* Quick-fill chips */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-gray-400">Common notes:</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => onChange(value ? `${value}, ${ex}` : ex)}
              className="text-xs px-3 py-1.5 border border-gray-200 rounded-full
                         text-gray-500 active:bg-gray-50 transition-colors"
            >
              + {ex}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-5 bg-red-500 text-white text-xl font-semibold rounded-2xl
                   active:bg-red-600 transition-colors mt-2"
      >
        Build my itinerary ✨
      </button>

      <p className="text-center text-xs text-gray-300">
        You can skip this — just tap the button above.
      </p>
    </div>
  )
}
