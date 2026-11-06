import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowUpRight, CalendarClock, Check, CheckCircle2, ClipboardCheck, Clock3,
  History, MapPin, Navigation, Pause, Play, Route as RouteIcon, ShieldAlert,
  Truck,
} from 'lucide-react'
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { routeService } from '../../services/routeService'
import { runService } from '../../services/runService'

const stopColors = {
  completed: '#52d273',
  in_progress: '#f4b740',
  pending: '#5aa8ff',
  missed: '#f07066',
}

function FitRouteMap({ points }) {
  const map = useMap()

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize()
      if (points.length > 1) map.fitBounds(points, { padding: [28, 28], maxZoom: 15 })
      else if (points.length === 1) map.setView(points[0], 14)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [map, points])

  return null
}

function FollowPosition({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) map.panTo(position, { animate: true, duration: 0.6 })
  }, [map, position])

  return null
}

function directionsUrl(stop) {
  const destination = `${stop.latitude},${stop.longitude}`
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving`
}

function makePreviewTrack(points) {
  const track = []
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index]
    const to = points[index + 1]
    for (let step = 0; step < 30; step += 1) {
      const progress = step / 30
      track.push([
        from[0] + (to[0] - from[0]) * progress,
        from[1] + (to[1] - from[1]) * progress,
      ])
    }
  }
  if (points.length) track.push(points[points.length - 1])
  return track
}

function Metric({ label, value, detail, icon: Icon, color }) {
  return (
    <article className="flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.07] bg-[#111814] p-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${color}`}><Icon size={18} /></span>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-[#829087]">{label}</p>
        <p className="mt-0.5 text-xl font-extrabold leading-tight">{value}</p>
        <p className="mt-1 truncate text-[10px] text-[#718078]">{detail}</p>
      </div>
    </article>
  )
}

export default function CollectorDashboard() {
  const [runs, setRuns] = useState([])
  const [routes, setRoutes] = useState([])
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [position, setPosition] = useState(null)
  const [positionSource, setPositionSource] = useState('')
  const [journeyStatus, setJourneyStatus] = useState('idle')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [locationError, setLocationError] = useState('')
  const locationWatchId = useRef(null)
  const previewIntervalId = useRef(null)
  const lastLocationSentAt = useRef(0)
  const previewIndex = useRef(0)

  useEffect(() => {
    let active = true
    Promise.all([
      runService.my(true),
      routeService.list({ activeOnly: true }),
    ])
      .then(async ([todayRuns, availableRoutes]) => {
        const missingIds = [...new Set(todayRuns.map((run) => run.route_id))]
          .filter((id) => !availableRoutes.some((route) => route.id === id))
        const missingRoutes = await Promise.all(missingIds.map((id) => routeService.get(id)))
        const allRoutes = [...availableRoutes, ...missingRoutes]
        if (active) {
          setRuns(todayRuns)
          setRoutes(allRoutes)
          const currentRun = todayRuns.find((run) => ['in_progress', 'delayed'].includes(run.status))
          setSelectedRouteId(String(currentRun?.route_id || todayRuns[0]?.route_id || allRoutes[0]?.id || ''))
          setError('')
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load today’s work.') })
      .finally(() => { if (active) setLoading(false) })

    return () => {
      active = false
      if (locationWatchId.current !== null) navigator.geolocation?.clearWatch(locationWatchId.current)
      if (previewIntervalId.current !== null) window.clearInterval(previewIntervalId.current)
    }
  }, [])

  const activeRun = runs.find((run) => (
    String(run.route_id) === selectedRouteId && ['in_progress', 'delayed'].includes(run.status)
  ))
  const selectedRoute = routes.find((route) => String(route.id) === selectedRouteId)
  const routeStops = useMemo(() => (
    (selectedRoute?.stops || [])
      .filter((stop) => Number.isFinite(Number(stop.latitude)) && Number.isFinite(Number(stop.longitude)))
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
  ), [selectedRoute])
  const routePoints = useMemo(
    () => routeStops.map((stop) => [Number(stop.latitude), Number(stop.longitude)]),
    [routeStops],
  )
  const visitByStop = new Map((activeRun?.visits || []).map((visit) => [visit.stop_id, visit]))
  const nextStop = routeStops.find((stop) => {
    const status = visitByStop.get(stop.id)?.status
    return status === 'pending' || status === 'in_progress'
  })
  const completedStops = activeRun?.visits.filter((visit) => visit.status === 'completed').length || 0
  const totalStops = activeRun?.visits.length || routeStops.length
  const openStops = activeRun
    ? activeRun.visits.filter((visit) => ['pending', 'in_progress'].includes(visit.status)).length
    : routeStops.length
  const progress = totalStops ? Math.round((completedStops / totalStops) * 100) : 0
  const previewTrack = useMemo(() => makePreviewTrack(routePoints), [routePoints])

  function stopLocationUpdates() {
    if (locationWatchId.current !== null) {
      navigator.geolocation?.clearWatch(locationWatchId.current)
      locationWatchId.current = null
    }
    if (previewIntervalId.current !== null) {
      window.clearInterval(previewIntervalId.current)
      previewIntervalId.current = null
    }
  }

  async function startJourney() {
    setError('')
    setLocationError('')
    setBusy(true)
    stopLocationUpdates()
    setPosition(null)
    setPositionSource('')

    try {
      let run = activeRun
      if (!run) {
        if (!selectedRoute) throw new Error('Choose an active route before starting your journey.')
        run = await runService.start({ route_id: selectedRoute.id })
        setRuns((items) => [run, ...items])
      }

      if (!navigator.geolocation) {
        setJourneyStatus('error')
        setLocationError('Live location is not supported in this browser. You can still update your stops from Today’s tasks.')
        return
      }

      setJourneyStatus('waiting')
      locationWatchId.current = navigator.geolocation.watchPosition(
        ({ coords }) => {
          const current = [coords.latitude, coords.longitude]
          setPosition(current)
          setPositionSource('gps')
          setJourneyStatus('tracking')
          setLocationError('')

          const now = Date.now()
          if (now - lastLocationSentAt.current >= 15000) {
            lastLocationSentAt.current = now
            runService.sendLocation(run.id, current[0], current[1])
              .catch((requestError) => {
                setLocationError(requestError.message || 'Could not send your location to the server.')
              })
          }
        },
        (geoError) => {
          setJourneyStatus('error')
          const messages = {
            1: 'Location permission was denied. Allow location access in your browser and try again.',
            2: 'Your device could not determine a location. Check GPS or network access and try again.',
            3: 'Location request timed out. Try again when GPS reception is stronger.',
          }
          setLocationError(messages[geoError.code] || 'Could not get your location.')
          if (locationWatchId.current !== null) {
            navigator.geolocation.clearWatch(locationWatchId.current)
            locationWatchId.current = null
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
      )
    } catch (requestError) {
      setError(requestError.message || 'Could not start your journey.')
    } finally {
      setBusy(false)
    }
  }

  function startRoutePreview() {
    if (previewTrack.length < 2) {
      setError('This route needs at least two mapped stops for a route preview.')
      return
    }
    setError('')
    setLocationError('')
    stopLocationUpdates()
    previewIndex.current = 0
    setPosition(previewTrack[0])
    setPositionSource('preview')
    setJourneyStatus('preview')
    previewIntervalId.current = window.setInterval(() => {
      previewIndex.current = (previewIndex.current + 1) % previewTrack.length
      setPosition(previewTrack[previewIndex.current])
    }, 350)
  }

  function stopJourney() {
    stopLocationUpdates()
    setJourneyStatus('idle')
    setPosition(null)
    setPositionSource('')
    setLocationError('')
  }

  async function endJourney() {
    if (!activeRun || !window.confirm('End this collection run? Pending stops will remain pending.')) return
    setBusy(true)
    setError('')
    try {
      const finishedRun = await runService.end(activeRun.id)
      setRuns((items) => items.map((run) => run.id === finishedRun.id ? finishedRun : run))
      stopJourney()
    } catch (requestError) {
      setError(requestError.message || 'Could not end this collection run.')
    } finally {
      setBusy(false)
    }
  }

  async function completeNextStop() {
    if (!activeRun || !nextStop) return
    setBusy(true)
    setError('')
    try {
      const updatedRun = await runService.updateStop(activeRun.id, nextStop.id, { status: 'completed' })
      setRuns((items) => items.map((run) => run.id === updatedRun.id ? updatedRun : run))
    } catch (requestError) {
      setError(requestError.message || 'Could not update the next stop.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <p className="py-10 text-center text-sm text-muted">Loading today’s work…</p>
  if (error && !routes.length && !runs.length) {
    return (
      <div role="alert" className="rounded-xl border border-bad/40 bg-bad/10 p-4 text-sm text-bad">
        {error}
      </div>
    )
  }

  const todayRunCount = runs.length
  const isTracking = journeyStatus === 'tracking' || journeyStatus === 'waiting'

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 pb-6 text-[#e8eeea]">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#58c875]">Collector workspace</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Your collection work</h1>
          <p className="mt-1 text-sm text-[#829087]">Route progress and journey controls for today.</p>
        </div>
        <Link to="/collector/tasks" className="inline-flex items-center gap-2 rounded-lg bg-[#1f7a3d] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#278e48]">
          <ClipboardCheck size={16} /> Today’s tasks <ArrowUpRight size={14} />
        </Link>
      </header>

      {(error || locationError) && (
        <p role="alert" className="rounded-lg border border-[#713c38] bg-[#3a211f] px-3 py-2 text-sm text-[#ffaaa2]">
          {error || locationError}
        </p>
      )}

      <section aria-label="Today at a glance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Runs today" value={todayRunCount} detail="Assigned to you" icon={RouteIcon} color="bg-[#183321] text-[#71d88b]" />
        <Metric label="Journey" value={activeRun ? 'Active' : 'Not started'} detail={journeyStatus === 'tracking' ? 'Sharing GPS location' : journeyStatus === 'preview' ? 'Simulated route preview' : 'Start when you are ready'} icon={Truck} color="bg-[#1c3041] text-[#79b9ff]" />
        <Metric label="Stops complete" value={`${completedStops}/${totalStops}`} detail={`${progress}% of this route`} icon={CheckCircle2} color="bg-[#3a3320] text-[#f4c35d]" />
        <Metric label="Stops remaining" value={openStops} detail={nextStop ? `Next: ${nextStop.name}` : 'No pending stops'} icon={MapPin} color="bg-[#34283e] text-[#c2a9ff]" />
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-12">
        <article className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#111814] xl:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#718078]">Assigned route</p>
              {routes.length > 0 && !activeRun ? (
                <select
                  aria-label="Choose a route"
                  value={selectedRouteId}
                  onChange={(event) => {
                    setSelectedRouteId(event.target.value)
                    if (journeyStatus === 'preview') stopJourney()
                  }}
                  className="mt-1 max-w-full rounded-lg border border-white/[0.08] bg-[#0b100d] px-2.5 py-1.5 text-sm font-bold text-[#e8eeea]"
                >
                  {routes.map((route) => <option key={route.id} value={route.id}>{route.code} · {route.zone}</option>)}
                </select>
              ) : (
                <h2 className="mt-1 truncate text-base font-bold">{selectedRoute ? `${selectedRoute.code} · ${selectedRoute.zone}` : 'No route available'}</h2>
              )}
              {selectedRoute && <p className="mt-1 truncate text-xs text-[#829087]">{selectedRoute.name}</p>}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[#829087]">
              <span className={`h-2 w-2 rounded-full ${journeyStatus === 'tracking' ? 'animate-pulse bg-[#52d273]' : journeyStatus === 'preview' ? 'bg-[#f4b740]' : 'bg-[#66736a]'}`} />
              {journeyStatus === 'tracking' ? 'GPS location sharing' : journeyStatus === 'waiting' ? 'Waiting for GPS' : journeyStatus === 'preview' ? 'Simulated preview' : 'Journey not started'}
            </div>
          </div>

          <div className="relative mx-3 mb-3 overflow-hidden rounded-lg border border-white/[0.06] sm:mx-4">
            <MapContainer
              key={selectedRoute?.id || 'collector-route-map'}
              center={routePoints[0] || [20.2961, 85.8245]}
              zoom={12}
              scrollWheelZoom
              style={{ height: 'min(58vh, 500px)', minHeight: '340px', width: '100%' }}
              className="dashboard-dark-map"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <FitRouteMap points={routePoints} />
              <FollowPosition position={position} />
              {routePoints.length > 1 && (
                <Polyline positions={routePoints} pathOptions={{ color: '#52d273', weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' }} />
              )}
              {routeStops.map((stop) => {
                const status = visitByStop.get(stop.id)?.status || 'pending'
                return (
                  <CircleMarker
                    key={stop.id}
                    center={[Number(stop.latitude), Number(stop.longitude)]}
                    radius={stop.id === nextStop?.id ? 8 : 6}
                    pathOptions={{ color: '#f4f7f5', weight: 2, fillColor: stopColors[status] || stopColors.pending, fillOpacity: 1 }}
                  >
                    <Tooltip>{stop.sequence}. {stop.name} · {status.replaceAll('_', ' ')}</Tooltip>
                  </CircleMarker>
                )
              })}
              {position && (
                <>
                  <CircleMarker center={position} radius={19} pathOptions={{ color: positionSource === 'gps' ? '#4b9cf0' : '#f4b740', weight: 2, opacity: 0.8, fillOpacity: 0.12 }} />
                  <CircleMarker center={position} radius={8} pathOptions={{ color: '#fff', weight: 2, fillColor: positionSource === 'gps' ? '#4b9cf0' : '#f4b740', fillOpacity: 1 }}>
                    <Tooltip>{positionSource === 'gps' ? 'Your current GPS location' : 'Simulated route preview position'}</Tooltip>
                  </CircleMarker>
                </>
              )}
            </MapContainer>
            <span className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-md border border-white/10 bg-[#111814]/95 px-2 py-1 text-[10px] text-[#c5cec8]">
              OpenStreetMap · {selectedRoute?.zone || 'route view'}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4 text-[10px] text-[#829087]">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#52d273]" /> Completed</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#f4b740]" /> In progress</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#5aa8ff]" /> Pending</span>
              {position && <span className="inline-flex items-center gap-1"><span className={`h-2 w-2 rounded-full ${positionSource === 'gps' ? 'bg-[#4b9cf0]' : 'bg-[#f4b740]'}`} /> {positionSource === 'gps' ? 'GPS position' : 'Simulated position'}</span>}
            </div>
            <Link to="/collector/routes" className="inline-flex items-center gap-1 font-semibold text-[#71d88b] hover:text-white">Route details <ArrowUpRight size={12} /></Link>
          </div>
        </article>

        <div className="flex flex-col gap-4 xl:col-span-4">
          <article className="rounded-xl border border-white/[0.07] bg-[#111814] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#718078]">Journey control</p>
                <h2 className="mt-1 text-base font-bold">{activeRun ? `Run #${activeRun.id}` : 'Ready to start'}</h2>
                <p className="mt-1 text-xs capitalize text-[#829087]">{activeRun ? activeRun.status.replaceAll('_', ' ') : 'Start a run and share your GPS position'}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${journeyStatus === 'tracking' ? 'bg-[#183321] text-[#71d88b]' : journeyStatus === 'preview' ? 'bg-[#3a3320] text-[#f4c35d]' : 'bg-[#18201c] text-[#9daa9f]'}`}>
                {journeyStatus === 'tracking' ? 'GPS on' : journeyStatus === 'waiting' ? 'Connecting' : journeyStatus === 'preview' ? 'Preview' : 'GPS off'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy || isTracking || !selectedRoute}
                onClick={startJourney}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#1f7a3d] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-[#278e48] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Play size={14} /> {activeRun ? 'Start journey' : 'Start journey'}
              </button>
              {isTracking ? (
                <button type="button" onClick={stopJourney} className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-3 py-2.5 text-xs font-semibold text-[#c5cec8] hover:bg-white/[0.04]">
                  <Pause size={14} /> Pause GPS
                </button>
              ) : (
                <button
                  type="button"
                  disabled={journeyStatus === 'preview' || busy || routePoints.length < 2}
                  onClick={startRoutePreview}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-3 py-2.5 text-xs font-semibold text-[#c5cec8] hover:bg-white/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Navigation size={14} /> Preview route
                </button>
              )}
            </div>

            {journeyStatus === 'preview' && (
              <button type="button" onClick={stopJourney} className="mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold text-[#f4c35d] hover:bg-white/[0.04]">
                Stop simulated preview
              </button>
            )}
            {activeRun && (
              <button type="button" disabled={busy} onClick={endJourney} className="mt-2 w-full rounded-lg border border-[#713c38]/70 px-3 py-2 text-xs font-semibold text-[#ffaaa2] hover:bg-[#3a211f]/50 disabled:opacity-50">
                End collection run
              </button>
            )}
            {journeyStatus === 'preview' && <p className="mt-3 text-[10px] text-[#a88a50]">Preview position is simulated and is not sent to the server.</p>}
            {positionSource === 'gps' && position && <p className="mt-3 text-[10px] text-[#829087]">GPS fix: {position[0].toFixed(5)}, {position[1].toFixed(5)} · Updates are shared every 15 seconds.</p>}
          </article>

          <article className="rounded-xl border border-white/[0.07] bg-[#111814] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#718078]">Next collection</p>
                <h2 className="mt-1 text-base font-bold">{nextStop?.name || 'No pending stops'}</h2>
              </div>
              {nextStop && <span className="rounded-full bg-[#18201c] px-2.5 py-1 text-[10px] text-[#9daa9f]">Stop {nextStop.sequence}</span>}
            </div>
            {nextStop ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={directionsUrl(nextStop)} target="_blank" rel="noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-3 py-2.5 text-xs font-semibold hover:bg-white/[0.04]">
                  <Navigation size={14} className="text-[#71d88b]" /> Directions
                </a>
                {activeRun && (
                  <button type="button" disabled={busy} onClick={completeNextStop} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/[0.1] px-3 py-2.5 text-xs font-semibold hover:bg-white/[0.04] disabled:opacity-50">
                    <Check size={14} className="text-[#71d88b]" /> Mark complete
                  </button>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-[#829087]">You’re all caught up on this route.</p>
            )}
          </article>

          <article className="rounded-xl border border-white/[0.07] bg-[#111814] p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#718078]">Route stops</p>
                <h2 className="mt-1 text-base font-bold">Collection order</h2>
              </div>
              <span className="text-[10px] text-[#829087]">{routeStops.length} total</span>
            </div>
            {routeStops.length ? (
              <ol className="mt-3 max-h-[250px] space-y-1 overflow-y-auto pr-1">
                {routeStops.map((stop, index) => {
                  const status = visitByStop.get(stop.id)?.status || 'pending'
                  return (
                    <li key={stop.id} className="relative flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/[0.03]">
                      {index < routeStops.length - 1 && <span className="absolute bottom-0 left-[15px] top-8 w-px bg-white/[0.08]" />}
                      <span className="relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-[#18201c] text-[10px] font-bold" style={{ color: stopColors[status] || stopColors.pending }}>
                        {stop.sequence}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold">{stop.name}</span>
                        <span className="mt-0.5 flex items-center gap-1 text-[10px] capitalize text-[#829087]">
                          <Clock3 size={10} /> {stop.expected_time ? stop.expected_time.slice(0, 5) : 'Time not set'} · {status.replaceAll('_', ' ')}
                        </span>
                      </span>
                      <a href={directionsUrl(stop)} target="_blank" rel="noreferrer" aria-label={`Directions to ${stop.name}`} className="rounded-md p-1.5 text-[#71d88b] hover:bg-white/[0.06]">
                        <Navigation size={13} />
                      </a>
                    </li>
                  )
                })}
              </ol>
            ) : (
              <p className="mt-3 text-xs text-[#829087]">No mapped stops are available for this route.</p>
            )}
          </article>
        </div>
      </section>

      <section aria-label="Quick actions">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#718078]">Shortcuts</p>
            <h2 className="mt-1 text-base font-bold">Your tools</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Today’s tasks', detail: 'Update stops and run status', icon: ClipboardCheck, to: '/collector/tasks', color: 'text-[#71d88b]', bg: 'bg-[#183321]' },
            { label: 'My routes', detail: 'Review route details', icon: RouteIcon, to: '/collector/routes', color: 'text-[#79b9ff]', bg: 'bg-[#1c3041]' },
            { label: 'My schedule', detail: 'Check collection windows', icon: CalendarClock, to: '/collector/schedule', color: 'text-[#f4c35d]', bg: 'bg-[#3a3320]' },
            { label: 'Report an issue', detail: 'Flag a route problem', icon: ShieldAlert, to: '/collector/report-issue', color: 'text-[#c2a9ff]', bg: 'bg-[#34283e]' },
          ].map(({ label, detail, icon: Icon, to, color, bg }) => (
            <Link key={to} to={to} className="group flex items-center gap-3 rounded-xl border border-white/[0.07] bg-[#111814] p-3.5 transition hover:border-white/[0.14] hover:bg-[#151d18]">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${bg} ${color}`}><Icon size={17} /></span>
              <span className="min-w-0 flex-1"><span className="block text-xs font-bold">{label}</span><span className="mt-1 block truncate text-[10px] text-[#829087]">{detail}</span></span>
              <ArrowUpRight size={14} className="shrink-0 text-[#718078] transition group-hover:text-[#71d88b]" />
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-white/[0.07] bg-[#111814] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#18201c] text-[#829087]"><History size={17} /></span>
            <div><h2 className="text-sm font-bold">Today’s runs</h2><p className="mt-1 text-[10px] text-[#829087]">Collection activity assigned to you</p></div>
          </div>
          <Link to="/collector/history" className="inline-flex items-center gap-1 text-xs font-semibold text-[#71d88b] hover:text-white">Collection history <ArrowUpRight size={13} /></Link>
        </div>
        {runs.length ? (
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {runs.map((run) => {
              const route = routes.find((item) => item.id === run.route_id)
              return (
                <li key={run.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs">
                  <span className="flex items-center gap-2"><RouteIcon size={14} className="text-[#71d88b]" />Run #{run.id} · {route?.code || `Route #${run.route_id}`}</span>
                  <span className="capitalize text-[#829087]">{run.status.replaceAll('_', ' ')}</span>
                </li>
              )
            })}
          </ul>
        ) : <p className="mt-4 text-sm text-[#829087]">No runs are assigned to your account today.</p>}
      </section>
    </div>
  )
}
