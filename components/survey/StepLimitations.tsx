'use client'

interface Props {
  value:    string
  onChange: (v: string) => void
  onSubmit: () => void
  onBack:   () => void
}

// Full implementation built in Day 6.
export function StepLimitations({ onSubmit, onBack }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="text-gray-400 text-sm self-start">← Back</button>
      <h2 className="text-2xl font-bold text-gray-900">Anything to know?</h2>
      <p className="text-gray-400 text-sm">Coming in Day 6…</p>
      <button onClick={onSubmit}
        className="w-full py-4 bg-red-500 text-white text-xl font-semibold rounded-2xl">
        Build my itinerary ✨
      </button>
    </div>
  )
}
