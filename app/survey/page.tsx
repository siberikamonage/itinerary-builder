'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useItinerary } from '@/context/ItineraryContext'
import { TripGoal } from '@/types'
import { ProgressBar } from '@/components/survey/ProgressBar'
import { StepDuration } from '@/components/survey/StepDuration'
import { StepHomeBase } from '@/components/survey/StepHomeBase'
import { StepGoals } from '@/components/survey/StepGoals'
import { StepLimitations } from '@/components/survey/StepLimitations'

export default function SurveyPage() {
  const router = useRouter()
  const { submitSurvey, loading } = useItinerary()

  const [step,        setStep]        = useState(0)
  const [duration,    setDuration]    = useState(5)
  const [homeBase,    setHomeBase]    = useState('')
  const [goals,       setGoals]       = useState<TripGoal[]>([])
  const [limitations, setLimitations] = useState('')

  function handleSubmit() {
    submitSurvey({ duration, homeBase, goals, limitations })
    router.push('/itinerary')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-400 text-sm">Loading places…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col max-w-lg mx-auto">
      <ProgressBar current={step + 1} total={4} />

      <div className="flex-1 px-4 py-6">
        {step === 0 && (
          <StepDuration
            value={duration}
            onChange={setDuration}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepHomeBase
            value={homeBase}
            onChange={setHomeBase}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepGoals
            selected={goals}
            onChange={setGoals}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepLimitations
            value={limitations}
            onChange={setLimitations}
            onSubmit={handleSubmit}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  )
}
