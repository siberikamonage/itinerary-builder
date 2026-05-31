import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Shanghai Itinerary Builder',
  description: 'Build a personalized day-by-day itinerary for Shanghai in 2 minutes. Free, no sign-up required.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
