'use client'

import { useState } from 'react'
import { TripGoal } from '@/types'

const GOALS: { id: TripGoal; label: string; icon: string; description: string }[] = [
  { id: 'culture-history', label: 'Culture & History', icon: '🏛️', description: 'Temples, monuments, heritage sites' },
  { id: 'food-drink',      label: 'Food & Drink',      icon: '🍜', description: 'Restaurants, street food, local eats' },
  { id: 'shopping',        label: 'Shopping',           icon: '🛍️', description: 'Markets, malls, boutiques' },
  { id: 'nature-parks',    label: 'Nature & Parks',     icon: '🌿', description: 'Gardens, parks, waterways' },
  { id: 'nightlife',       label: 'Nightlife',          icon: '🌙', description: 'Bars, clubs, live music' },
  { id: 'art-museums',     label: 'Art & Museums',      icon: '🎨', description: 'Galleries, exhibitions, theatres' },
  { id: 'family-friendly', label: 'Family-friendly',    icon: '👨‍👩‍👧', description: 'Kid-safe, accessible, easy-paced' },
  { id: 'hidden-gems',     label: 'Hidden Gems',        icon: '💎', description: 'Off the beaten path, local secrets' },
]

interface Props {
  selected: TripGoal[]
  onChange: (goals: TripGoal[]) => void
  onNext:   () => void
  onBack:   () => void
}

export function StepGoals({ selected, onChange, onNext, onBack }: Props) {
  const [error, setError] = useState('')

  function toggle(id: TripGoal) {
    onChange(
      selected.includes(id)
        ? selected.filter(g => g !== id)
        : [...selected, id]
    )
    setError('')
  }

  function handleNext() {
    if (selected.length === 0) {
      setError('Pick at least one to continue.')
      return
    }
    onNext()
  }

  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="text-gray-400 text-sm self-start">
        ← Back
      </button>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">What's the vibe?</h2>
        <p className="text-gray-400 mt-2 text-sm">
          Choose everything that fits — we'll mix it in.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GOALS.map(goal => {
          const active = selected.includes(goal.id)
          return (
            <button
              key={goal.id}
              onClick={() => toggle(goal.id)}
              className={`
                flex flex-col items-start gap-1 px-4 py-3 rounded-2xl border-2
                text-left transition-all active:scale-95
                ${active
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-gray-200 bg-white text-gray-700'}
              `}
            >
              <span className="text-2xl">{goal.icon}</span>
              <span className="text-sm font-semibold leading-tight">{goal.label}</span>
              <span className={`text-xs leading-tight ${active ? 'text-red-400' : 'text-gray-400'}`}>
                {goal.description}
              </span>
            </button>
          )
        })}
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {/* Selected count pill */}
      {selected.length > 0 && (
        <p className="text-sm text-gray-400 text-center">
          {selected.length} {selected.length === 1 ? 'interest' : 'interests'} selected
        </p>
      )}

      <button
        onClick={handleNext}
        className="w-full py-4 bg-red-500 text-white text-lg font-semibold rounded-2xl
                   active:bg-red-600 transition-colors"
      >
        Continue →
      </button>
    </div>
  )
}
