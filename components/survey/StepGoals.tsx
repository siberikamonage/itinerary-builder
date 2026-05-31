'use client'

import { TripGoal } from '@/types'

interface Props {
  selected: TripGoal[]
  onChange: (goals: TripGoal[]) => void
  onNext:   () => void
  onBack:   () => void
}

// Full implementation built in Day 6.
export function StepGoals({ onNext, onBack }: Props) {
  return (
    <div className="flex flex-col gap-6">
      <button onClick={onBack} className="text-gray-400 text-sm self-start">← Back</button>
      <h2 className="text-2xl font-bold text-gray-900">What's the vibe?</h2>
      <p className="text-gray-400 text-sm">Coming in Day 6…</p>
      <button onClick={onNext}
        className="w-full py-4 bg-red-500 text-white text-lg font-semibold rounded-2xl">
        Continue →
      </button>
    </div>
  )
}
