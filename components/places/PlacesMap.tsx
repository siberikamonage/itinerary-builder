// Always loaded via dynamic(() => import(...), { ssr: false })
// Safe to reference browser-only Leaflet APIs at module level.

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { Place } from '@/types'
import { CATEGORY_ICONS, CATEGORY_COLORS } from '@/lib/place-utils'

// ─── Leaflet Webpack / Next.js icon fix ───────────────────────────────────────
// Identical fix to DayMap.tsx — Webpack rewrites the private method Leaflet
// uses to resolve icon URLs; overriding with CDN URLs bypasses it entirely.
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Category-coloured dot pin ────────────────────────────────────────────────
// Small 12px circle — works better than teardrops at zoom 12 with 800+ pins.
function categoryPin(category: string): L.DivIcon {
  const color = CATEGORY_COLORS[category] ?? '#546E7A'
  return L.divIcon({
    className: '',
    html: `<div style="
      background:${color};
      width:12px;height:12px;
      border-radius:50%;
      border:2.5px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,.35);
    "></div>`,
    iconSize:    [12, 12],
    iconAnchor:  [6, 6],
    popupAnchor: [0, -10],
  })
}

const SHANGHAI_CENTER: [number, number] = [31.2304, 121.4737]

interface Props {
  places:  Place[]
  listUrl: string   // embedded in popup "View details" link for back-nav
}

export default function PlacesMap({ places, listUrl }: Props) {
  // Only render places that have valid coordinates
  const mapped = places.filter(p => p.lat && p.lng)

  return (
    // Height fills viewport below the 108px sticky header (HEADER_H in PlacesListClient)
    <div style={{ height: 'calc(100vh - 108px)', width: '100%' }}>
      <MapContainer
        center={SHANGHAI_CENTER}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
        zoomControl
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {mapped.map(place => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={categoryPin(place.category)}
          >
            <Popup>
              <div style={{ minWidth: 140 }}>
                <p style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3, marginBottom: 4 }}>
                  {CATEGORY_ICONS[place.category] ?? '📍'} {place.name.en}
                </p>
                <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 6 }}>
                  {place.district} · {place.category}
                </p>
                <a
                  href={`/places/${place.id}?from=${encodeURIComponent(listUrl)}`}
                  style={{ fontSize: 12, color: '#ef4444', textDecoration: 'none', fontWeight: 500 }}
                >
                  View details →
                </a>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>
    </div>
  )
}
