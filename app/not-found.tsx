import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 gap-6">
      <div className="text-6xl">🗺️</div>
      <h1 className="text-2xl font-bold text-gray-900 text-center">Page not found</h1>
      <p className="text-gray-400 text-center text-sm">
        Your itinerary lives in this browser tab only — it clears when you close the page.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-red-500 text-white font-semibold rounded-2xl"
      >
        Start a new itinerary
      </Link>
    </main>
  )
}
