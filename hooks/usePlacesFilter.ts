'use client'

// usePlacesFilter — owns filter state and URL synchronisation.
// Active tags are stored in the URL as ?tags=culture-history,food-drink so
// that back-navigation from the detail page always restores the exact filter.
//
// Requires the calling component to be wrapped in <Suspense> because
// useSearchParams() opts the component out of static rendering in Next.js.

import { useCallback, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useItinerary } from '@/context/ItineraryContext'
import { TripGoal } from '@/types'

export function usePlacesFilter() {
  const { places }  = useItinerary()
  const router      = useRouter()
  const pathname    = usePathname()
  const params      = useSearchParams()

  // ── Read active tags from URL ──────────────────────────────────────────────
  const activeTags: TripGoal[] = useMemo(() => {
    const raw = params.get('tags')
    if (!raw) return []
    return raw.split(',').filter(Boolean) as TripGoal[]
  }, [params])

  // ── Filter then sort ───────────────────────────────────────────────────────
  // Sorting: curated places first (same order as places.json), then OSM,
  // each sub-group alphabetical by English name.
  const filtered = useMemo(() => {
    const base =
      activeTags.length === 0
        ? [...places]
        : places.filter(p => p.tags.some(t => activeTags.includes(t)))

    return base.sort((a, b) => {
      if (a.curated && !b.curated) return -1
      if (!a.curated && b.curated) return 1
      return a.name.en.localeCompare(b.name.en)
    })
  }, [places, activeTags])

  // ── Write tags back to URL (no new history entry) ─────────────────────────
  const setTags = useCallback(
    (tags: TripGoal[]) => {
      const next = new URLSearchParams(params.toString())
      if (tags.length === 0) {
        next.delete('tags')
      } else {
        next.set('tags', tags.join(','))
      }
      const qs = next.toString()
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname, params],
  )

  const toggleTag = useCallback(
    (tag: TripGoal) => {
      setTags(
        activeTags.includes(tag)
          ? activeTags.filter(t => t !== tag)
          : [...activeTags, tag],
      )
    },
    [activeTags, setTags],
  )

  const clearTags = useCallback(() => setTags([]), [setTags])

  return {
    filtered,
    activeTags,
    toggleTag,
    clearTags,
    totalCount:    places.length,
    filteredCount: filtered.length,
  }
}
