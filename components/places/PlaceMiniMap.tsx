// Always loaded via dynamic(() => import(...), { ssr: false })
// Safe to reference browser-only Leaflet APIs at module level.

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

// Leaflet Webpack / Next.js icon fix — identical to DayMap.tsx
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface Props {
  lat:  number
  lng:  number
  name: string
}

export default function PlaceMiniMap({ lat, lng, name }: Props) {
  return (
    <div style={{ height: 200, width: '100%' }}>
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]}>
          <Popup>{name}</Popup>
        </Marker>
      </MapContainer>
    </div>
  )
}
