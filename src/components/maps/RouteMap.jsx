import MapView from './MapView'

const DEFAULT_CENTER = [20.2961, 85.8245]

export default function RouteMap({ stops }) {
  const positions = stops
    .filter((stop) => Number.isFinite(stop.latitude) && Number.isFinite(stop.longitude))
    .map((stop) => [stop.latitude, stop.longitude])
  const center = positions[0] ?? DEFAULT_CENTER

  return (
    <MapView
      key={positions.map((position) => position.join(',')).join(';')}
      center={center}
      routes={positions.length > 1 ? [{ id: 'Route preview', color: '#3fb868', path: positions }] : []}
      className="h-64"
    />
  )
}
