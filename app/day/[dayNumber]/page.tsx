// Server component — satisfies static export by pre-generating all 14 day shells.
// Actual content is rendered by the client component which reads from React context.
import DayViewClient from './DayViewClient'

export function generateStaticParams() {
  return Array.from({ length: 14 }, (_, i) => ({ dayNumber: String(i + 1) }))
}

export default function DayPage() {
  return <DayViewClient />
}
