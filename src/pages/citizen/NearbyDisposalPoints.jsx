import { useEffect, useState } from 'react'
import MapView from '../../components/maps/MapView'
import {
  createIllustrativeWasteSites,
  getDrivingRoute,
  searchAddresses,
} from '../../services/openStreetMapService'

const CITIES = [
  { name: 'Puri', latitude: 19.8135, longitude: 85.8312 },
  { name: 'Bhubaneswar', latitude: 20.2961, longitude: 85.8245 },
  { name: 'Cuttack', latitude: 20.4625, longitude: 85.883 },
  { name: 'Konark', latitude: 19.8876, longitude: 86.0945 },
  { name: 'Sambalpur', latitude: 21.4669, longitude: 83.9812 },
  { name: 'Rourkela', latitude: 22.2604, longitude: 84.8536 },
  { name: 'Berhampur', latitude: 19.3149, longitude: 84.7941 },
]
const INITIAL_CITY = CITIES[0]

function distanceKm(from, to) {
  const radians = (degrees) => degrees * Math.PI / 180
  const latDelta = radians(to.latitude - from.latitude)
  const lonDelta = radians(to.longitude - from.longitude)
  const value = Math.sin(latDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude))
    * Math.sin(lonDelta / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))
}

function formatDistance(meters) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

export default function NearbyDisposalPoints() {
  const [cityName, setCityName] = useState(INITIAL_CITY.name)
  const [origin, setOrigin] = useState(INITIAL_CITY)
  const [addressQuery, setAddressQuery] = useState(INITIAL_CITY.name)
  const [suggestions, setSuggestions] = useState([])
  const [addressBusy, setAddressBusy] = useState(false)
  const [points, setPoints] = useState(() => createIllustrativeWasteSites(INITIAL_CITY))
  const usingIllustrativeLocations = points.some((point) => point.isIllustrative)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [route, setRoute] = useState(null)
  const [routeBusyId, setRouteBusyId] = useState(null)
  const [routeError, setRouteError] = useState('')

  useEffect(() => {
    const query = addressQuery.trim()
    if (query.length < 3 || query === cityName || query === 'Your current location') {
      return undefined
    }

    let active = true
    const timeoutId = setTimeout(() => {
      searchAddresses(query, origin)
        .then((results) => { if (active) setSuggestions(results) })
        .catch(() => { if (active) setSuggestions([]) })
    }, 400)
    return () => {
      active = false
      clearTimeout(timeoutId)
    }
  }, [addressQuery, cityName, origin])

  async function searchNearby(location, label) {
    setOrigin(location)
    setCityName(label)
    setAddressQuery(label)
    setSuggestions([])
    setSelectedId(null)
    setRoute(null)
    setRouteError('')
    setError('')
    setPoints(createIllustrativeWasteSites(location))
  }

  async function useMyLocation() {
    setError('')
    if (!navigator.geolocation) {
      setError('Location access is not available in this browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => searchNearby(
        { latitude: coords.latitude, longitude: coords.longitude },
        'Your current location',
      ),
      () => setError('Could not access your location. Allow location permission or choose a city instead.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  async function searchAddress(event) {
    event.preventDefault()
    const query = addressQuery.trim()
    if (!query) {
      setError('Enter a starting address or place.')
      return
    }
    setAddressBusy(true)
    setError('')
    try {
      const results = await searchAddresses(query, origin)
      const match = results[0]
      if (!match) {
        setError('Could not find that address. Try adding the city or choosing a suggestion.')
        return
      }
      searchNearby({ latitude: match.latitude, longitude: match.longitude }, match.label)
    } catch (requestError) {
      setError(requestError.message || 'Could not find that address.')
    } finally {
      setAddressBusy(false)
    }
  }

  function chooseAddress(suggestion) {
    searchNearby({ latitude: suggestion.latitude, longitude: suggestion.longitude }, suggestion.label)
  }

  async function showRoute(point) {
    setError('')
    setRouteError('')
    setRoute(null)
    setSelectedId(point.id)
    setRouteBusyId(point.id)
    try {
      const result = await getDrivingRoute(origin, point)
      setRoute({ ...result, pointId: point.id })
    } catch (requestError) {
      setRouteError(requestError.message || 'Could not calculate a driving route.')
    } finally {
      setRouteBusyId(null)
    }
  }

  const orderedPoints = points
    .map((point) => ({ ...point, distanceFromOrigin: distanceKm(origin, point) }))
    .sort((a, b) => a.distanceFromOrigin - b.distanceFromOrigin)
  const selectedPoint = points.find((point) => point.id === selectedId)
  const mapMarkers = [
    { id: 'origin', position: [origin.latitude, origin.longitude], label: `${cityName} · starting point`, tone: 'origin' },
    ...orderedPoints.map((point) => ({
      id: point.id,
      position: [point.latitude, point.longitude],
      label: point.name,
      tone: point.id === selectedId ? 'selected' : 'site',
    })),
  ]
  const mapRoutes = route ? [{
    id: 'Driving route',
    color: '#f59e0b',
    path: route.path,
  }] : []

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Nearby waste bins and disposal sites</h2>
        <p className="mt-1 text-sm text-muted">Find nearby mapped locations and view directions from your starting point.</p>
      </header>

      <section className="space-y-3 rounded-xl border border-line bg-panel p-4">
        <form onSubmit={searchAddress} className="flex flex-wrap items-end gap-2">
          <label className="relative min-w-56 flex-1 text-sm text-muted">
            Starting address or place
            <input
              type="search"
              autoComplete="off"
              value={addressQuery}
              onChange={(event) => {
                setAddressQuery(event.target.value)
                setSuggestions([])
              }}
              placeholder="Example: Puri Railway Station"
              className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text"
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-[1000] mt-1 max-h-56 w-full overflow-auto rounded-lg border border-line bg-panel shadow-xl">
                {suggestions.map((suggestion) => (
                  <li key={`${suggestion.latitude}-${suggestion.longitude}-${suggestion.label}`}>
                    <button type="button" onClick={() => chooseAddress(suggestion)}
                      className="w-full px-3 py-2 text-left text-sm text-text hover:bg-panel-2">
                      {suggestion.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </label>
          <button type="submit" disabled={addressBusy}
            className="rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
            {addressBusy ? 'Finding address…' : 'Find nearby bins'}
          </button>
          <button type="button" onClick={useMyLocation}
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-panel-2 disabled:opacity-50">
            Use my current location
          </button>
        </form>
        <label className="block max-w-sm text-sm text-muted">
          Or choose an Odisha city
          <select value={CITIES.some((city) => city.name === cityName) ? cityName : ''}
            onChange={(event) => {
              const city = CITIES.find((item) => item.name === event.target.value)
              if (city) searchNearby(city, city.name)
            }}
            className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text">
            {!CITIES.some((city) => city.name === cityName) && <option value="">Choose a city</option>}
            {CITIES.map((city) => <option key={city.name} value={city.name}>{city.name}</option>)}
          </select>
        </label>
        <p className="text-xs text-muted">Address suggestions use OpenStreetMap. You can also allow browser location or choose an Odisha city.</p>
      </section>

      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

      <section className="space-y-2 rounded-xl border border-line bg-panel p-3">
        {usingIllustrativeLocations && (
          <p role="status" className="rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 text-sm text-warn">
            Nearby prototype locations are approximate and unverified. Directions follow roads to the selected coordinates.
          </p>
        )}
        {route && selectedPoint && (
          <p role="status" className="text-sm text-ok">
            Driving route to {selectedPoint.name}: {formatDistance(route.distanceMeters)}, about {Math.round(route.durationSeconds / 60)} min from {cityName}.
          </p>
        )}
        {routeError && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{routeError}</p>}
        {origin && (
          <MapView
            key={`${origin.latitude},${origin.longitude}`}
            center={[origin.latitude, origin.longitude]}
            zoom={13}
            markers={mapMarkers}
            routes={mapRoutes}
            className="h-[28rem]"
          />
        )}
        <p className="text-xs text-muted">
          {usingIllustrativeLocations
            ? 'Prototype locations are approximate and unverified.'
            : 'Map data © OpenStreetMap contributors. Locations are community-mapped, not an official municipal inventory; verify access before visiting.'}
          {' '}Routes are estimates from the public OSRM routing service.
        </p>
      </section>

      {route && selectedPoint && (
        <section className="rounded-xl border border-line bg-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-bold">Directions to {selectedPoint.name}</h3>
            <a
              className="text-sm font-bold text-leaf hover:underline"
              href={`https://www.google.com/maps/dir/?api=1&origin=${origin.latitude},${origin.longitude}&destination=${selectedPoint.latitude},${selectedPoint.longitude}&travelmode=driving`}
              target="_blank"
              rel="noreferrer"
            >
              Open directions in Google Maps
            </a>
          </div>
          <ol className="mt-3 list-inside list-decimal space-y-2 text-sm">
            {route.steps.map((step, index) => (
              <li key={`${index}-${step.instruction}`} className="text-text">
                {step.instruction}
                <span className="ml-2 text-muted">{formatDistance(step.distanceMeters)}</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-muted">Estimated road directions from the public OSRM demo service. Follow road signs and use your judgment.</p>
        </section>
      )}

      {orderedPoints.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-bold">Nearest mapped locations</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {orderedPoints.map((point) => (
              <article key={point.id} className="rounded-xl border border-line bg-panel p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold">{point.name}</h4>
                    <p className="mt-1 text-sm capitalize text-muted">
                      {point.category.replaceAll('_', ' ')}{point.isIllustrative && ' · Approximate'}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-muted">{point.distanceFromOrigin.toFixed(1)} km away</span>
                </div>
                <p className="mt-2 text-sm text-muted">{point.address}</p>
                {point.details && <p className="mt-1 text-sm text-muted">{point.details}</p>}
                <div className="mt-3 flex flex-wrap gap-4">
                  <button type="button" onClick={() => showRoute(point)} disabled={routeBusyId !== null}
                    className="text-sm font-bold text-leaf hover:underline disabled:opacity-50">
                    {routeBusyId === point.id ? 'Finding route…' : 'Show directions'}
                  </button>
                  {point.mapUrl && (
                    <a className="text-sm font-bold text-leaf hover:underline" href={point.mapUrl} target="_blank" rel="noreferrer">
                      Verify on OpenStreetMap
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
