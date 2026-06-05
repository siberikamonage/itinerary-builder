import { notFound }       from 'next/navigation'
import placesRaw           from '@/public/data/places.json'
import PlaceDetailClient   from './PlaceDetailClient'
import { Place }           from '@/types'

const places = placesRaw as unknown as Place[]

// Pre-render a static detail page for every place at build time.
// With 815 places this adds ~30s to the build but means every page is
// served as static HTML — no server round-trip on navigation.
export function generateStaticParams() {
  return places.map(p => ({ id: p.id }))
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function PlaceDetailPage({ params }: Props) {
  const { id } = await params
  const place   = places.find(p => p.id === id)
  if (!place) notFound()
  return <PlaceDetailClient place={place} />
}
