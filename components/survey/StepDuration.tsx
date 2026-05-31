interface Props {
  value:    number
  onChange: (v: number) => void
  onNext:   () => void
}

export function StepDuration({ value, onChange, onNext }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">How many days in Shanghai?</h2>
        <p className="text-gray-400 mt-2 text-sm">We'll fill every day with the right places.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-center gap-6 py-4">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-14 h-14 rounded-full bg-gray-100 text-2xl font-bold text-gray-700
                     flex items-center justify-center active:bg-gray-200 transition-colors"
          aria-label="Decrease days"
        >
          −
        </button>

        <div className="text-center w-20">
          <span className="text-6xl font-bold text-gray-900">{value}</span>
          <p className="text-sm text-gray-400 mt-1">{value === 1 ? 'day' : 'days'}</p>
        </div>

        <button
          onClick={() => onChange(Math.min(14, value + 1))}
          className="w-14 h-14 rounded-full bg-gray-100 text-2xl font-bold text-gray-700
                     flex items-center justify-center active:bg-gray-200 transition-colors"
          aria-label="Increase days"
        >
          +
        </button>
      </div>

      <p className="text-center text-xs text-gray-300">1 – 14 days</p>

      <button
        onClick={onNext}
        className="w-full py-4 bg-red-500 text-white text-lg font-semibold rounded-2xl
                   active:bg-red-600 transition-colors mt-auto"
      >
        Continue →
      </button>
    </div>
  )
}
