'use client'

import { useEffect } from 'react'
import { Place } from '@/types'

const COST_LABELS = ['Free', '$', '$$', '$$$']

interface Props {
  place:      Place
  candidates: Place[]
  onSwap:     (replacement: Place) => void
  onClose:    () => void
}

export function SwapModal({ place, candidates, onSwap, onClose }: Props) {
  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="relative bg-white rounded-t-3xl px-4 pt-4 pb-10
                      flex flex-col gap-4 max-h-[80vh] overflow-y-auto">

        {/* Drag handle */}
        <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-1" />

        {/* Header */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">Replacing</p>
          <h2 className="text-lg font-bold text-gray-900 mt-0.5">{place.name.en}</h2>
        </div>

        <p className="text-sm font-semibold text-gray-700">Choose a replacement:</p>

        {/* Candidate list */}
        {candidates.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            No alternatives found for this category.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {candidates.map(candidate => (
              <button
                key={candidate.id}
                onClick={() => onSwap(candidate)}
                className="w-full text-left bg-gray-50 border border-gray-200 rounded-2xl
                           p-4 flex flex-col gap-1 active:bg-red-50 active:border-red-300
                           transition-colors"
              >
                <p className="font-semibold text-gray-900">{candidate.name.en}</p>
                <p className="text-sm text-gray-500 line-clamp-2">{candidate.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                  <span>{candidate.district}</span>
                  <span>·</span>
                  <span>~{candidate.visit_duration_min} min</span>
                  <span>·</span>
                  <span>{COST_LABELS[candidate.cost_level]}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full py-3 border border-gray-200 text-gray-500 rounded-2xl
                     active:bg-gray-50 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
