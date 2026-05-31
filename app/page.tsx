import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg text-center flex flex-col gap-6">
        <div className="text-7xl">🏙️</div>

        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          Your perfect Shanghai trip, planned in 2 minutes.
        </h1>

        <p className="text-gray-500 text-lg leading-relaxed">
          Tell us what you love. We'll build a day-by-day itinerary around
          your style, your hotel, and your pace.
        </p>

        <p className="text-sm text-gray-300">
          ✓ No sign-up &nbsp;&nbsp; ✓ No cost &nbsp;&nbsp; ✓ Works offline
        </p>

        <Link
          href="/survey"
          className="w-full py-5 bg-red-500 text-white text-xl font-semibold
                     rounded-2xl text-center mt-4 block active:bg-red-600 transition-colors"
        >
          Plan my trip →
        </Link>
      </div>
    </main>
  )
}
