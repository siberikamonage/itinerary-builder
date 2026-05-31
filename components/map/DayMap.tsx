// This file is always loaded via dynamic(() => import(...), { ssr: false })
// so it is safe to reference browser-only Leaflet APIs at module level.

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { ItineraryPlace } from '@/types'

// ─── Fix Webpack / Next.js breaking the default Leaflet marker icons ───────────
// Leaflet resolves icon URLs at runtime via a private method that Webpack
// rewrites. Overriding mergeOptions with CDN URLs bypasses the issue entirely.
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// ─── Time-slot colours for numbered markers ────────────────────────────────────
const SLOT_COLORS: Record<string, string> = {
  Morning:   '#f97316',  // orange-500
  Afternoon: '#3b82f6',  // blue-500
  Evening:   '#8b5cf6',  // violet-500
}

function coloredIcon(color: string, label: string) {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background:${color};
        width:28px;height:28px;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,.3);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);color:white;font-size:11px;font-weight:700;line-height:1">
          ${label}
        </span>
      </div>`,
    iconSize:   [28, 28],
    iconAnchor: [14, 28],
    popupAnchor:[0, -30],
  })
}

// ─── Auto-fit the map to show all pins after mount ────────────────────────────
function BoundsFitter({ places }: { places: ItineraryPlace[] }) {
  const map = useMap()

  useEffect(() => {
    if (places.length === 0) return
    const bounds = L.latLngBounds(places.map(p => [p.lat, p.lng]))
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 15 })
  }, [map, places])

  return null
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  places: ItineraryPlace[]
}

// Shanghai city centre — used as the initial center before BoundsFitter runs
const SHANGHAI_CENTER: [number, number] = [31.2304, 121.4737]

export default function DayMap({ places }: Props) {
  if (places.length === 0) return null

  return (
    <div className="h-52 w-full z-0 relative">
      <MapContainer
        center={SHANGHAI_CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <BoundsFitter places={places} />

        {places.map((place, i) => {
          const color = SLOT_COLORS[place.timeSlot] ?? '#6b7280'
          const icon  = coloredIcon(color, String(i + 1))

          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={icon}
            >
              <Popup>
                <div className="text-sm font-semibold leading-snug">
                  {i + 1}. {place.name.en}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {place.timeSlot} · ~{place.visit_duration_min} min
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
