import { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, ArrowUpRight, BellRing, CalendarClock, CheckCircle2,
  Clock3, LocateFixed, MapPin, Navigation, Route as RouteIcon, Save, Trash2, Truck,
} from 'lucide-react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { routeService } from '../../services/routeService'
import { runService } from '../../services/runService'
import { scheduleService } from '../../services/scheduleService'
import { citizenBinStatusService } from '../../services/citizenBinStatusService'
import { formatWasteType } from '../../utils/formatWasteType'

const BIN_LEVELS = [
  { value: 'empty', label: 'Empty', fill: 0 },
  { value: 'half_full', label: 'Half full', fill: 50 },
  { value: 'full', label: 'Full', fill: 100 },
]

function FitMapToPoints({ points }) {
  const map = useMap()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize()
      if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 14 })
      else if (points.length === 1) map.setView(points[0], 13)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [map, points])

  return null
}

function distanceMeters(a, b) {
  const radians = (degrees) => degrees * Math.PI / 180
  const latitudeDelta = radians(b.latitude - a.latitude)
  const longitudeDelta = radians(b.longitude - a.longitude)
  const latitudeA = radians(a.latitude)
  const latitudeB = radians(b.latitude)
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2
  return 6371000 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
}

function statusLabel(status) {
  return String(status || 'not_started').replaceAll('_', ' ')
}

function Metric({ label, value, detail, icon: Icon, tone }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-line bg-panel p-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${tone}`}><Icon size={18} /></span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-muted">{label}</p>
        <p className="mt-0.5 text-xl font-extrabold leading-tight">{value}</p>
        <p className="mt-1 truncate text-[10px] text-muted">{detail}</p>
      </div>
    </article>
  )
}

export default function CitizenDashboard() {
  const { user } = useAuth()
  const [routes, setRoutes] = useState([])
  const [schedules, setSchedules] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [tracking, setTracking] = useState(null)
  const [binStatus, setBinStatus] = useState(null)
  const [binFillLevel, setBinFillLevel] = useState('')
  const [binStatusLoading, setBinStatusLoading] = useState(true)
  const [binStatusSaving, setBinStatusSaving] = useState(false)
  const [binStatusError, setBinStatusError] = useState('')
  const [binStatusMessage, setBinStatusMessage] = useState('')
  const [citizenPosition, setCitizenPosition] = useState(null)
  const [nearestDistance, setNearestDistance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    let active = true
    citizenBinStatusService.mine()
      .then((status) => {
        if (active) {
          setBinStatus(status)
          setBinFillLevel(status?.fill_level || '')
        }
      })
      .catch((requestError) => {
        if (active) setBinStatusError(requestError.message || 'Could not load your bin status.')
      })
      .finally(() => { if (active) setBinStatusLoading(false) })
    return () => { active = false }
  }, [])

  async function saveBinStatus(event) {
    event.preventDefault()
    if (!binFillLevel) return

    setBinStatusSaving(true)
    setBinStatusError('')
    setBinStatusMessage('')
    try {
      const savedStatus = await citizenBinStatusService.report(binFillLevel)
      setBinStatus(savedStatus)
      setBinFillLevel(savedStatus.fill_level)
      setBinStatusMessage('Your bin status has been updated.')
    } catch (requestError) {
      setBinStatusError(requestError.message || 'Could not update your bin status.')
    } finally {
      setBinStatusSaving(false)
    }
  }

  useEffect(() => {
    let active = true
    Promise.all([
      routeService.list({ activeOnly: true }),
      scheduleService.list(),
    ])
      .then(([routeRows, scheduleRows]) => {
        if (active) {
          setRoutes(routeRows)
          setSchedules(scheduleRows.filter((schedule) => schedule.is_active))
          setSelectedRouteId((current) => current || String(routeRows[0]?.id || ''))
          setError('')
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load collection routes and schedules.') })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedRouteId) return undefined

    let active = true
    let timer
    const refreshTracking = async () => {
      try {
        const progress = await runService.track(Number(selectedRouteId))
        if (active) {
          setTracking(progress)
          setError('')
        }
      } catch (requestError) {
        if (active) setError(requestError.message || 'Could not refresh truck progress.')
      } finally {
        if (active) {
          timer = window.setTimeout(refreshTracking, 30000)
        }
      }
    }

    refreshTracking()
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [selectedRouteId])

  const selectedRoute = routes.find((route) => String(route.id) === selectedRouteId)
  const routeStops = useMemo(() => (
    (selectedRoute?.stops || [])
      .filter((stop) => Number.isFinite(Number(stop.latitude)) && Number.isFinite(Number(stop.longitude)))
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
  ), [selectedRoute])
  const routePoints = useMemo(() => routeStops.map((stop) => [Number(stop.latitude), Number(stop.longitude)]), [routeStops])
  const truckPosition = useMemo(() => (
    tracking?.location?.available
      ? [Number(tracking.location.latitude), Number(tracking.location.longitude)]
      : null
  ), [tracking])
  const mapPoints = useMemo(() => [
    ...routePoints,
    ...(citizenPosition ? [[citizenPosition.latitude, citizenPosition.longitude]] : []),
  ], [routePoints, citizenPosition])
  const todaySchedules = (tracking?.scheduled_today || []).filter((item) => item.cancelled || item.window_start || item.window_end)
  const activeScheduleCount = schedules.filter((schedule) => schedule.route_id === selectedRoute?.id).length
  const delayed = tracking?.run_status === 'delayed'
  const isLiveGps = tracking?.location?.available && !tracking.location.is_demo
  const metersText = (value) => value < 1000 ? `${Math.round(value)} m away` : `${(value / 1000).toFixed(1)} km away`

  function locateArea() {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Location is not supported by this browser. Choose your area from the route list instead.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { latitude: coords.latitude, longitude: coords.longitude }
        setCitizenPosition(location)
        const closest = routes
          .flatMap((route) => (route.stops || [])
            .filter((stop) => Number.isFinite(Number(stop.latitude)) && Number.isFinite(Number(stop.longitude)))
            .map((stop) => ({
              route,
              distance: distanceMeters(location, { latitude: Number(stop.latitude), longitude: Number(stop.longitude) }),
            })))
          .sort((a, b) => a.distance - b.distance)[0]

        if (closest) {
          setSelectedRouteId(String(closest.route.id))
          setTracking(null)
          setNearestDistance(closest.distance)
        } else {
          setLocationError('No mapped collection stops were found. Choose an area from the route list.')
        }
        setLocating(false)
      },
      (geoError) => {
        const messages = {
          1: 'Location permission was denied. Allow location access in your browser or choose an area manually.',
          2: 'Your location could not be determined. Try again or choose an area manually.',
          3: 'The location request timed out. Try again or choose an area manually.',
        }
        setLocationError(messages[geoError.code] || 'Could not determine your location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 15000 },
    )
  }

  if (loading) return <p className="py-8 text-center text-sm text-muted">Loading your area’s collection information…</p>

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-leaf">Community collection service</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Welcome, {user?.full_name || 'resident'}</h1>
          <p className="mt-1 text-sm text-muted">Find your collection area and check the assigned truck’s latest progress.</p>
        </div>
        <Link to="/citizen/schedules" className="inline-flex items-center gap-2 rounded-lg border border-line bg-panel px-3 py-2 text-sm font-semibold hover:bg-panel-2">
          <CalendarClock size={16} className="text-leaf" /> All schedules <ArrowUpRight size={14} />
        </Link>
      </header>

      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {locationError && <p role="status" className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-[#e3bf76]">{locationError}</p>}

      <section aria-label="Area collection status" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Collection area" value={selectedRoute?.zone || 'Choose area'} detail={selectedRoute?.code || 'Select a route below'} icon={MapPin} tone="bg-[#183321] text-[#71d88b]" />
        <Metric label="Assigned truck" value={tracking?.vehicle_registration || 'Not assigned'} detail={tracking?.vehicle_type || 'For this collection route'} icon={Truck} tone="bg-[#1c3041] text-[#79b9ff]" />
        <Metric label="Truck progress" value={tracking ? `${tracking.stops_completed}/${tracking.stops_total}` : '—'} detail={tracking ? `${statusLabel(tracking.run_status)} · stops completed` : 'Waiting for route update'} icon={RouteIcon} tone="bg-[#3a3320] text-[#f4c35d]" />
        <Metric label="Published collections" value={activeScheduleCount} detail="Pickup windows for this route" icon={CalendarClock} tone="bg-[#34283e] text-[#c2a9ff]" />
      </section>

      {delayed && (
        <section role="alert" className="flex gap-3 rounded-xl border border-[#8b5a21]/60 bg-[#3a2c19] p-4 text-[#f5d493]">
          <AlertTriangle size={20} className="mt-0.5 shrink-0 text-[#f4b740]" />
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Collection delay for {tracking.route_code} · {tracking.zone}</h2>
            <p className="mt-1 text-xs text-[#d9c292]">
              {tracking.delay_reason || 'The collection truck has reported a delay.'}
              {tracking.delay_minutes ? ` · approximately ${tracking.delay_minutes} minutes` : ''}
              {tracking.delay_revised_time ? ` · revised time ${tracking.delay_revised_time.slice(0, 5)}` : ''}
            </p>
          </div>
          <BellRing size={16} className="ml-auto mt-0.5 shrink-0" />
        </section>
      )}

      <section className="grid items-start gap-4 xl:grid-cols-12">
        <article className="overflow-hidden rounded-xl border border-line bg-panel xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Truck and route map</p>
              <h2 className="mt-1 text-base font-bold">{selectedRoute ? `${selectedRoute.code} · ${selectedRoute.zone}` : 'Choose your collection area'}</h2>
              {tracking?.location?.available && (
                <p className="mt-1 text-[10px] text-muted">
                  {isLiveGps ? 'Last reported truck location' : 'Simulated truck position · not live GPS'} · {tracking.location.age_minutes} min ago
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Choose collection area" value={selectedRouteId} onChange={(event) => {
                setSelectedRouteId(event.target.value)
                setTracking(null)
                setNearestDistance(null)
              }} className="max-w-48 rounded-lg border border-line bg-ink px-2.5 py-2 text-xs">
                {routes.map((route) => <option key={route.id} value={route.id}>{route.code} · {route.zone}</option>)}
              </select>
              <button type="button" onClick={locateArea} disabled={locating || !routes.length}
                className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                <LocateFixed size={14} /> {locating ? 'Locating…' : 'Find my area'}
              </button>
            </div>
          </div>

          {selectedRoute && routePoints.length ? (
            <div className="relative mx-3 mb-3 overflow-hidden rounded-lg border border-line sm:mx-4">
              <MapContainer
                key={selectedRoute.id}
                center={mapPoints[0] || [20.2961, 85.8245]}
                zoom={12}
                scrollWheelZoom
                style={{ height: 'min(55vh, 480px)', minHeight: '320px', width: '100%' }}
                className="dashboard-dark-map"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <FitMapToPoints points={mapPoints} />
                {routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: '#52d273', weight: 4, opacity: 0.9, dashArray: '7 6' }} />}
                {routeStops.map((stop) => (
                  <CircleMarker key={stop.id} center={[Number(stop.latitude), Number(stop.longitude)]} radius={5}
                    pathOptions={{ color: '#fff', weight: 1.5, fillColor: '#52d273', fillOpacity: 1 }}>
                    <Tooltip>{stop.sequence}. {stop.name}</Tooltip>
                  </CircleMarker>
                ))}
                {truckPosition && (
                  <CircleMarker center={truckPosition} radius={9} pathOptions={{ color: '#fff', weight: 2, fillColor: '#4b9cf0', fillOpacity: 1 }}>
                    <Tooltip>
                      {tracking.vehicle_registration || 'Collection truck'} · {tracking.location.is_demo ? 'simulated position, not live GPS' : 'last reported position'}
                    </Tooltip>
                  </CircleMarker>
                )}
                {citizenPosition && (
                  <CircleMarker center={[citizenPosition.latitude, citizenPosition.longitude]} radius={7}
                    pathOptions={{ color: '#fff', weight: 2, fillColor: '#c2a9ff', fillOpacity: 1 }}>
                    <Tooltip>Your location (used only to find the nearest listed route)</Tooltip>
                  </CircleMarker>
                )}
              </MapContainer>
              <span className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-md border border-white/10 bg-[#111814]/95 px-2 py-1 text-[10px] text-[#c5cec8]">
                OpenStreetMap · {selectedRoute.zone}
              </span>
            </div>
          ) : (
            <div className="mx-3 mb-3 grid min-h-48 place-items-center rounded-lg border border-dashed border-line px-4 text-center sm:mx-4">
              <div><MapPin size={22} className="mx-auto text-muted" /><p className="mt-2 text-sm font-semibold">No mapped route stops</p><p className="mt-1 text-xs text-muted">Choose another route or check back later.</p></div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 text-[10px] text-muted">
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#52d273]" />Route stops</span>
              {truckPosition && <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#4b9cf0]" />Truck</span>}
              {citizenPosition && <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#c2a9ff]" />You</span>}
            </div>
            <span>Refreshes every 30 seconds</span>
          </div>
          {nearestDistance !== null && <p className="px-4 pb-4 text-[10px] text-muted">Nearest listed stop: {metersText(nearestDistance)}. This uses the closest route stop, not an official service boundary.</p>}
        </article>

        <div className="space-y-4 xl:col-span-4">
          <article className={`rounded-xl border p-4 ${delayed ? 'border-[#8b5a21]/60 bg-[#3a2c19]' : 'border-line bg-panel'}`}>
            <div className="flex items-start gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${delayed ? 'bg-[#59401e] text-[#f4b740]' : 'bg-[#183321] text-[#71d88b]'}`}>
                {delayed ? <AlertTriangle size={17} /> : <Truck size={17} />}
              </span>
              <div className="min-w-0">
                <p className={`text-[10px] font-bold uppercase tracking-[0.16em] ${delayed ? 'text-[#f4c35d]' : 'text-muted'}`}>Truck status</p>
                <h2 className="mt-1 text-base font-bold">{delayed ? 'Delayed collection' : statusLabel(tracking?.run_status)}</h2>
                <p className="mt-1 text-xs text-muted">{tracking?.vehicle_registration ? `${tracking.vehicle_registration}${tracking.vehicle_type ? ` · ${tracking.vehicle_type}` : ''}` : 'Truck is assigned when a run starts'}</p>
              </div>
            </div>
            {tracking?.location?.available ? (
              <p className="mt-3 flex items-start gap-1.5 text-[10px] text-muted"><Clock3 size={12} className="mt-0.5 shrink-0" />{isLiveGps ? 'Last reported position' : 'Simulated position · not live GPS'}: {tracking.location.age_minutes} min ago</p>
            ) : (
              <p className="mt-3 text-[10px] text-muted">{tracking?.location?.message || 'Truck location is not currently available.'}</p>
            )}
          </article>

          <article className="rounded-xl border border-line bg-panel p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#183321] text-[#71d88b]">
                <Trash2 size={17} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">My household bin</p>
                <h2 className="mt-1 text-base font-bold">
                  {binStatusLoading
                    ? 'Loading status…'
                    : BIN_LEVELS.find((level) => level.value === binStatus?.fill_level)?.label || 'Not reported'}
                </h2>
                <p className="mt-1 text-xs text-muted">Self-reported · update when the fill level changes</p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink" role="progressbar"
              aria-label="Reported household bin fill level"
              aria-valuenow={BIN_LEVELS.find((level) => level.value === binStatus?.fill_level)?.fill ?? 0}
              aria-valuemin={0} aria-valuemax={100}>
              <div
                className={`h-full rounded-full transition-all ${binStatus?.fill_level === 'full' ? 'bg-[#f07070]' : 'bg-[#52d273]'}`}
                style={{ width: `${BIN_LEVELS.find((level) => level.value === binStatus?.fill_level)?.fill ?? 0}%` }}
              />
            </div>
            {binStatus?.updated_at && (
              <p className="mt-2 text-[10px] text-muted">
                Last updated {new Date(binStatus.updated_at).toLocaleString()}
              </p>
            )}
            <form onSubmit={saveBinStatus} className="mt-3 flex gap-2">
              <label className="sr-only" htmlFor="citizen-bin-fill-level">Household bin fill level</label>
              <select id="citizen-bin-fill-level" value={binFillLevel}
                onChange={(event) => {
                  setBinFillLevel(event.target.value)
                  setBinStatusMessage('')
                }}
                disabled={binStatusLoading || binStatusSaving}
                className="min-w-0 flex-1 rounded-lg border border-line bg-ink px-2.5 py-2 text-xs">
                <option value="">Choose fill level</option>
                {BIN_LEVELS.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
              </select>
              <button type="submit" disabled={!binFillLevel || binStatusLoading || binStatusSaving}
                className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-3 py-2 text-xs font-bold text-white disabled:opacity-50">
                <Save size={13} /> {binStatusSaving ? 'Saving…' : 'Update'}
              </button>
            </form>
            {binStatusError && <p role="alert" className="mt-2 text-[10px] text-bad">{binStatusError}</p>}
            {binStatusMessage && <p role="status" className="mt-2 text-[10px] text-[#71d88b]">{binStatusMessage}</p>}
          </article>

          <article className="rounded-xl border border-line bg-panel p-4">
            <div className="flex items-center justify-between gap-2">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Today’s collections</p><h2 className="mt-1 text-base font-bold">Pickup windows</h2></div>
              <Link to="/citizen/schedules" aria-label="View all collection schedules" className="rounded-md p-1.5 text-leaf hover:bg-panel-2"><ArrowUpRight size={15} /></Link>
            </div>
            {todaySchedules.length ? (
              <ul className="mt-3 divide-y divide-line">
                {todaySchedules.map((item) => (
                  <li key={item.schedule_id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
                    <span>{formatWasteType(item.waste_type)}</span>
                    <span className={item.cancelled ? 'text-[#f4c35d]' : 'text-muted'}>
                      {item.cancelled ? 'Cancelled' : item.window_start && item.window_end ? `${item.window_start.slice(0, 5)}–${item.window_end.slice(0, 5)}` : item.note || 'Time not set'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs text-muted">{tracking ? 'No collection window is scheduled for this area today.' : 'Loading today’s collection windows…'}</p>
            )}
            <p className="mt-3 border-t border-line pt-3 text-[10px] text-muted">
              {schedules.some((schedule) => schedule.route_id === selectedRoute?.id && schedule.waste_type === 'wet_and_dry')
                ? 'Wet and dry are collected together by the route-assigned truck during this published pickup window.'
                : 'Collection times and waste streams follow the published schedule for this route.'}
            </p>
          </article>

          <article className="rounded-xl border border-line bg-panel p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Quick links</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link to="/citizen/schedules" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-2.5 text-[11px] font-semibold hover:bg-panel-2"><CalendarClock size={13} className="text-leaf" /> Schedule</Link>
              <Link to="/citizen/routes" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-2.5 text-[11px] font-semibold hover:bg-panel-2"><Navigation size={13} className="text-leaf" /> Route status</Link>
              <Link to="/citizen/missed-collection" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-2.5 text-[11px] font-semibold hover:bg-panel-2"><AlertTriangle size={13} className="text-leaf" /> Report missed</Link>
              <Link to="/citizen/complaints" className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-2.5 text-[11px] font-semibold hover:bg-panel-2"><CheckCircle2 size={13} className="text-leaf" /> My reports</Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
