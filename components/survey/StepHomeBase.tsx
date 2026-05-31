'use client'

import { useState } from 'react'
import { matchHomeDistrict } from '@/lib/geocoder'

interface Props {
  value:    string
  onChange: (v: string) => void
  onNext:   () => void
  onBack:   () => void
}

export function StepHomeBase({ value, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState('')

  // Peek at whether we can match a district so we can give a hint
  const matched = value.trim() ? matchHomeDistrict(value) : null

  function handleNext() {
    if (!value.trim()) {
      setError('Please enter your hotel or neighbourhood.')
      return
    }
    setError('')
    onNext()
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="text-gray-400 text-sm self-start">
        ← Back
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Where are you staying?</h2>
        <p className="text-gray-400 mt-2 text-sm">
          We'll start your first day close to your base.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setError('') }}
          placeholder="e.g. The Sukhothai, Jing'an"
          className="w-full border border-gray-200 rounded-xl px-4 py-4 text-base
                     focus:outline-none focus:border-red-400 transition-colors"
        />

        {/* District match hint */}
        {matched && !error && (
          <p className="text-xs text-green-600 px-1">
            ✓ We'll prioritise places near {matched}
          </p>
        )}
        {value.trim() && !matched && !error && (
          <p className="text-xs text-gray-400 px-1">
            Neighbourhood not recognised — we'll use city centre as your base.
          </p>
        )}
        {error && (
          <p className="text-xs text-red-500 px-1">{error}</p>
        )}
      </div>

      <button
        onClick={handleNext}
        className="w-full py-4 bg-red-500 text-white text-lg font-semibold rounded-2xl
                   active:bg-red-600 transition-colors mt-auto"
      >
        Continue →
      </button>
    </div>
  )
}
