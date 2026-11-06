import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet'

const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'

export default function MapView({ center, zoom = 12, routes = [], vehicles = [], markers = [], className = 'h-80' }) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} className={`w-full rounded-lg ${className}`}>
      <TileLayer url={TILES} attribution={ATTRIBUTION} />

      {routes.map((r) => (
        <Polyline key={r.id} positions={r.path} pathOptions={{ color: r.color, weight: 4, opacity: 0.85, dashArray: '8 6' }}>
          <Tooltip sticky>{r.id}</Tooltip>
        </Polyline>
      ))}

      {vehicles.filter((v) => v.position).map((v) => (
        <CircleMarker
          key={v.id}
          center={v.position}
          radius={9}
          pathOptions={{ color: '#fff', weight: 2, fillColor: v.tone === 'warn' ? '#e3a62f' : '#3fb868', fillOpacity: 1 }}
        >
          <Tooltip>
            <strong>{v.id}</strong> · {v.route}<br />
            Last reported {v.lastUpdate}
          </Tooltip>
        </CircleMarker>
      ))}

      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={marker.position}
          radius={marker.tone === 'origin' ? 8 : 7}
          pathOptions={{
            color: '#fff',
            weight: 2,
            fillColor: marker.tone === 'origin' ? '#3b82f6' : marker.tone === 'selected' ? '#e3a62f' : '#3fb868',
            fillOpacity: 1,
          }}
        >
          <Tooltip>{marker.label}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}