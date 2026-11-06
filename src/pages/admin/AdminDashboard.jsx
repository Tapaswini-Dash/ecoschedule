import { Fragment, useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight, CalendarDays, CheckCircle2, Clock3, Leaf, MapPin, MessageSquareWarning,
  Route as RouteIcon, ShieldCheck, Truck,
} from 'lucide-react'
import { divIcon } from 'leaflet'
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { Link } from 'react-router-dom'
import { analyticsService } from '../../services/analyticsService'
import { dashboardService } from '../../services/dashboardService'
import { routeService } from '../../services/routeService'
import { runService } from '../../services/runService'
import { vehicleService } from '../../services/vehicleService'
import { scheduleService } from '../../services/scheduleService'
import { userService } from '../../services/userService'
import { complaintService } from '../../services/complaintService'
import { complianceService } from '../../services/complianceService'
import { formatWasteType } from '../../utils/formatWasteType'

const routeColors = ['#52d273', '#4b9cf0', '#f4b740', '#f07066', '#a88af5']
const number = (value) => Number(value || 0).toLocaleString()
const vehicleIcon = divIcon({
  className: 'dashboard-vehicle-marker',
  html: '<span class="dashboard-vehicle-marker__body"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7zM7 18a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 7 18Zm11 0a1.8 1.8 0 1 0 0-3.6A1.8 1.8 0 0 0 18 18Z" fill="currentColor" stroke="white" stroke-width="1.2" stroke-linejoin="round"/></svg></span>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
})

function dateOffset(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function Panel({ title, eyebrow, action, children, className = '' }) {
  return (
    <section className={`rounded-2xl border border-white/[0.07] bg-[#111814] p-4 sm:p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          {eyebrow && <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#718078]">{eyebrow}</p>}
          <h2 className="text-sm font-bold text-[#e8eeea] sm:text-base">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function FitMapToPoints({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [28, 28], maxZoom: 14 })
  }, [map, points])
  return null
}

function coverageHull(stops) {
  const points = stops.map((stop) => [Number(stop.longitude), Number(stop.latitude)])
    .sort(([x1, y1], [x2, y2]) => x1 - x2 || y1 - y2)
  if (points.length < 3) return []

  const cross = (origin, a, b) => (
    (a[0] - origin[0]) * (b[1] - origin[1])
      - (a[1] - origin[1]) * (b[0] - origin[0])
  )
  const lower = []
  for (const point of points) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop()
    lower.push(point)
  }
  const upper = []
  for (const point of [...points].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop()
    upper.push(point)
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)].map(([longitude, latitude]) => [latitude, longitude])
}

function RouteMap({ routes, activeRuns, locationError }) {
  const mapRoutes = useMemo(() => routes.map((route, index) => ({
    ...route,
    color: routeColors[index % routeColors.length],
    stops: (route.stops || []).filter((stop) => Number.isFinite(Number(stop.latitude)) && Number.isFinite(Number(stop.longitude))),
  })), [routes])
  const coverageAreas = useMemo(() => mapRoutes.map((route) => ({
    ...route,
    bounds: coverageHull(route.stops),
  })), [mapRoutes])
  const liveVehicles = useMemo(() => activeRuns
    .filter((run) => run.location?.available && Number.isFinite(Number(run.location.latitude)) && Number.isFinite(Number(run.location.longitude)))
    .map((run) => ({
      ...run,
      position: [Number(run.location.latitude), Number(run.location.longitude)],
    })), [activeRuns])
  const boundsPoints = useMemo(() => [
    ...mapRoutes.flatMap((route) => route.stops.map((stop) => [Number(stop.latitude), Number(stop.longitude)])),
    ...liveVehicles.map((vehicle) => vehicle.position),
  ], [mapRoutes, liveVehicles])
  const hasStops = mapRoutes.some((route) => route.stops.length)

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#0b100d]">
      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-3 z-[1000] rounded-lg border border-white/10 bg-[#111814]/95 px-2.5 py-1.5 text-[10px] text-[#c5cec8]">
          OpenStreetMap · Bhubaneswar
        </div>
        <MapContainer
          center={[20.2961, 85.8245]}
          zoom={12}
          scrollWheelZoom={false}
          className="dashboard-dark-map h-[320px] w-full sm:h-[380px]"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <FitMapToPoints points={boundsPoints} />
          {coverageAreas.map((route) => {
            const positions = route.stops.map((stop) => [Number(stop.latitude), Number(stop.longitude)])
            return (
              <Fragment key={route.id}>
                {route.bounds.length > 2 && (
                  <Polygon
                    positions={route.bounds}
                    pathOptions={{ color: route.color, weight: 2, opacity: 0.9, fillColor: route.color, fillOpacity: 0.18 }}
                  >
                    <Tooltip sticky>{route.zone} · approximate coverage from route stops</Tooltip>
                  </Polygon>
                )}
                {positions.length > 1 && (
                  <Polyline positions={positions} pathOptions={{ color: route.color, weight: 4, opacity: 1, dashArray: '7 6', lineCap: 'round', lineJoin: 'round' }}>
                    <Tooltip sticky>{route.code} · {route.zone}</Tooltip>
                  </Polyline>
                )}
                {route.stops.map((stop, index) => (
                  <CircleMarker
                    key={`${route.id}-${stop.id}`}
                    center={[Number(stop.latitude), Number(stop.longitude)]}
                    radius={5}
                    pathOptions={{ color: '#f4f7f5', weight: 1.5, fillColor: route.color, fillOpacity: 1 }}
                  >
                    <Tooltip>{route.code} · {index + 1}. {stop.name}</Tooltip>
                  </CircleMarker>
                ))}
              </Fragment>
            )
          })}
          {liveVehicles.map((run) => (
            <Marker
              key={`vehicle-${run.vehicle_id || run.id}`}
              center={run.position}
              icon={vehicleIcon}
            >
              <Tooltip>
                <strong>{run.route_code}</strong> · {run.status.replaceAll('_', ' ')}<br />
                Last collector location report · {run.location.age_minutes} min ago
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
        {!hasStops && (
          <div className="pointer-events-none absolute inset-0 z-[500] grid place-items-center bg-[#0b100d]/45 px-4 text-center text-sm text-white">
            Add route stops to draw collection routes on the map.
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-white/[0.06] px-3 py-3">
        {mapRoutes.filter((route) => route.stops.length > 1).map((route) => (
          <span key={route.id} className="inline-flex items-center gap-1.5 text-[10px] text-[#aab5ae]">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: route.color }} />
            {route.code} · {route.zone}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 text-[10px] text-[#aab5ae]">
          <span className="h-2 w-2 rounded-full bg-[#2de16a]" />
          {liveVehicles.length} recent vehicle location{liveVehicles.length === 1 ? '' : 's'}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-[#718078]">
          <MapPin size={12} /> Shaded areas are approximate · location refreshes every 30s
        </span>
        {locationError && <p role="status" className="w-full text-[10px] text-[#f4c35d]">Vehicle locations unavailable: {locationError}</p>}
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const normalized = String(status || 'unknown').toLowerCase()
  const style = normalized === 'active' || normalized === 'completed' || normalized === 'in_progress' || normalized === 'resolved'
    ? 'border-[#2a6a3a] bg-[#183321] text-[#72dc8b]'
    : normalized === 'delayed' || normalized === 'workshop' || normalized === 'open' || normalized === 'pending' || normalized === 'under_review'
      ? 'border-[#71551f] bg-[#382d18] text-[#f4c35d]'
      : 'border-white/10 bg-white/[0.04] text-[#aab5ae]'
  return <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold capitalize ${style}`}>{normalized.replaceAll('_', ' ')}</span>
}

function CollectionTrend({ analytics }) {
  const days = useMemo(() => {
    const counts = new Map((analytics?.collections_by_day || []).map((item) => [item.date, item.completed_stops]))
    return Array.from({ length: 7 }, (_, index) => {
      const date = dateOffset(analytics.end_date, index - 6)
      return {
        date,
        label: new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }),
        count: counts.get(date) || 0,
      }
    })
  }, [analytics])
  const max = Math.max(1, ...days.map((day) => day.count))

  return (
    <div>
      <div className="flex h-44 items-end gap-2 border-b border-l border-white/[0.08] px-2 pb-2 pt-5 sm:gap-4">
        {days.map((day) => (
          <div key={day.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
            <span className="text-[10px] font-semibold text-[#9daa9f]">{number(day.count)}</span>
            <div className="flex h-full w-full items-end justify-center">
              <div
                className="w-full max-w-10 rounded-t-md bg-[#37b84d] transition-[height]"
                style={{ height: `${day.count ? Math.max((day.count / max) * 100, 8) : 3}%`, opacity: day.count ? 1 : 0.25 }}
                title={`${day.date}: ${day.count} completed stops`}
              />
            </div>
            <span className="text-[10px] text-[#718078]">{day.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] text-[#718078]">Completed collection stops per day · last 7 days</p>
    </div>
  )
}

function ScheduleMix({ schedules }) {
  const streams = useMemo(() => {
    const counts = new Map()
    for (const schedule of schedules.filter((item) => item.is_active !== false)) {
      const label = formatWasteType(schedule.waste_type)
      counts.set(label, (counts.get(label) || 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  }, [schedules])
  const total = streams.reduce((sum, [, count]) => sum + count, 0)
  const gradient = streams.reduce((result, [, count], index) => {
    const end = result.offset + (count / (total || 1)) * 100
    return {
      offset: end,
      segments: [...result.segments, `${routeColors[index % routeColors.length]} ${result.offset}% ${end}%`],
    }
  }, { offset: 0, segments: [] }).segments.join(', ')

  if (!streams.length) return <p className="py-8 text-center text-sm text-[#748178]">No active collection schedules.</p>

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative grid h-36 w-36 shrink-0 place-items-center rounded-full"
        style={{ background: `conic-gradient(${gradient})` }}>
        <div className="grid h-24 w-24 place-items-center rounded-full bg-[#111814] text-center">
          <div><p className="text-2xl font-extrabold">{total}</p><p className="text-[9px] text-[#829087]">active schedules</p></div>
        </div>
      </div>
      <ul className="w-full space-y-3">
        {streams.map(([label, count], index) => (
          <li key={label} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 capitalize text-[#b2bdb5]">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: routeColors[index % routeColors.length] }} />
              <span className="truncate">{label}</span>
            </span>
            <span className="shrink-0 text-[#9daa9f]">{count} schedules</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function UpcomingSchedules({ schedules, today }) {
  const upcoming = useMemo(() => {
    const occurrences = []
    for (let offset = 0; offset < 7; offset += 1) {
      const date = dateOffset(today, offset)
      const weekday = new Date(`${date}T00:00:00Z`).getUTCDay()
      const scheduleWeekday = (weekday + 6) % 7
      for (const schedule of schedules) {
        if (schedule.is_active === false || !schedule.days_of_week?.includes(scheduleWeekday)) continue
        if (schedule.valid_from && date < schedule.valid_from) continue
        if (schedule.valid_to && date > schedule.valid_to) continue
        const override = schedule.overrides?.find((item) => item.on_date === date)
        occurrences.push({
          ...schedule,
          date,
          cancelled: override?.kind === 'cancelled',
          start: override?.kind === 'rescheduled' ? override.new_window_start : schedule.window_start,
          end: override?.kind === 'rescheduled' ? override.new_window_end : schedule.window_end,
        })
      }
    }
    return occurrences
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.start || '').localeCompare(String(b.start || '')))
      .slice(0, 5)
  }, [schedules, today])

  const formatDate = (date) => {
    if (date === today) return 'Today'
    if (date === dateOffset(today, 1)) return 'Tomorrow'
    return new Date(`${date}T12:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
  const formatTime = (value) => value ? value.slice(0, 5) : null

  return (
    <Panel title="Upcoming collection schedules" eyebrow="Next 7 days"
      action={<Link to="/admin/schedules" className="inline-flex items-center gap-1 text-xs font-semibold text-[#71d88b] hover:text-white">All schedules <ArrowUpRight size={14} /></Link>}>
      {upcoming.length ? (
        <ul className="divide-y divide-white/[0.06]">
          {upcoming.map((item) => (
            <li key={`${item.id}-${item.date}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#183321] text-[#71d88b]">
                <CalendarDays size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold">{item.route_code} · <span className="capitalize">{formatWasteType(item.waste_type)}</span></p>
                  {item.cancelled && <StatusPill status="cancelled" />}
                </div>
                <p className="mt-1 truncate text-[10px] text-[#829087]">{item.zone}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold text-[#c5cec8]">{formatDate(item.date)}</p>
                <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#829087]">
                  <Clock3 size={11} />
                  {item.cancelled ? 'Cancelled' : formatTime(item.start) && formatTime(item.end) ? `${formatTime(item.start)}–${formatTime(item.end)}` : 'Time not set'}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-5 text-center text-sm text-[#748178]">No collection schedules in the next 7 days.</p>
      )}
    </Panel>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [activeRuns, setActiveRuns] = useState([])
  const [locationError, setLocationError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      dashboardService.summary(),
      routeService.list(),
      vehicleService.list(),
      scheduleService.list(),
      userService.list({ role: 'collector', limit: 100 }),
      complaintService.list(),
      complianceService.listViolations(),
    ])
      .then(([summary, routes, vehicles, schedules, personnel, complaints, violations]) => (
        analyticsService.operations({
          startDate: dateOffset(summary.today, -6),
          endDate: summary.today,
        }).then((analytics) => {
          if (active) {
            setData({ summary, routes, vehicles, schedules, personnel, complaints, violations, analytics })
            setError('')
          }
        })
      ))
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load operations data.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  useEffect(() => {
    let active = true
    let timer
    const refreshLocations = async () => {
      try {
        const runs = await runService.active()
        if (active) {
          setActiveRuns(runs)
          setLocationError('')
        }
      } catch (requestError) {
        if (active) setLocationError(requestError.message || 'Could not load active vehicle locations.')
      } finally {
        if (active) timer = window.setTimeout(refreshLocations, 30_000)
      }
    }
    refreshLocations()
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [revision])

  if (loading) return <p className="py-12 text-center text-sm text-[#95a39a]">Loading municipal operations…</p>
  if (error) {
    return (
      <div role="alert" className="rounded-xl border border-[#713c38] bg-[#3a211f] p-4 text-sm text-[#ffaaa2]">
        <p>{error}</p>
        <button onClick={() => { setLoading(true); setRevision((value) => value + 1) }} className="mt-3 font-bold underline">Retry</button>
      </div>
    )
  }
  if (!data) return <p role="status" className="py-12 text-center text-sm text-[#95a39a]">No operations data is available.</p>

  const { summary, routes, vehicles, schedules, personnel, complaints, violations, analytics } = data
  const runCounts = summary.runs_today_by_status || {}
  const totalRuns = Object.values(runCounts).reduce((total, count) => total + count, 0)
  const openComplaints = complaints.filter((item) => ['open', 'in_progress'].includes(item.status)).length
  const openViolations = violations.filter((item) => !['resolved', 'dismissed', 'closed'].includes(item.status)).length
  const completedStops = summary.stops_completed || 0
  const totalStops = completedStops + (summary.stops_missed || 0) + (summary.stops_pending || 0)
  const stopProgress = totalStops ? Math.round((completedStops / totalStops) * 100) : 0
  const activeVehicles = summary.vehicles_by_status?.active || 0
  const attentionItems = [
    ...violations.map((item) => ({ id: `violation-${item.id}`, label: item.category || 'Compliance report', detail: item.description, status: item.status, date: item.created_at, icon: ShieldCheck, href: '/admin/compliance' })),
    ...complaints.map((item) => ({ id: `complaint-${item.id}`, label: item.category || 'Service request', detail: item.description, status: item.status, date: item.created_at, icon: MessageSquareWarning, href: '/admin/complaints' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)

  return (
    <div className="mx-auto max-w-[1600px] space-y-3 pb-6 text-[#e8eeea] sm:space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#58c875]">Municipal operations</p>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Operations dashboard</h1>
          <p className="mt-1 text-sm text-[#829087]">Routes, collections, fleet, and community reports at a glance.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#111814] px-3 py-2 text-xs text-[#b0bbb3]">
          <Clock3 size={15} className="text-[#58c875]" />
          {new Date(`${summary.today}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </header>

      <div className="space-y-3">
        <div className="grid gap-4 xl:grid-cols-12">
          <div className="flex flex-col gap-4 xl:col-span-8">
            <Panel title="Live route map" eyebrow="Planned collection routes"
              action={<Link to="/admin/routes" className="inline-flex items-center gap-1 text-xs font-semibold text-[#71d88b] hover:text-white">Routes <ArrowUpRight size={14} /></Link>}>
              <RouteMap routes={routes} activeRuns={activeRuns} locationError={locationError} />
            </Panel>

            <Panel title="Fleet status" eyebrow={`${vehicles.length} vehicles in fleet`} className="flex-1"
              action={<Link to="/admin/fleet" className="inline-flex items-center gap-1 text-xs font-semibold text-[#71d88b] hover:text-white">View fleet <ArrowUpRight size={14} /></Link>}>
              {vehicles.length ? (
                <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                  {vehicles.slice(0, 6).map((vehicle) => {
                    const route = routes.find((item) => item.id === vehicle.assigned_route_id)
                    return (
                      <article key={vehicle.id} className="rounded-xl border border-white/[0.05] bg-[#0b100d] p-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex min-w-0 items-center gap-2"><Truck size={17} className="shrink-0 text-[#71d88b]" /><span className="truncate text-xs font-bold">{vehicle.registration}</span></span>
                          <StatusPill status={vehicle.status} />
                        </div>
                        <p className="mt-3 text-[10px] text-[#829087]">{route?.code || 'Unassigned'} · {vehicle.type}</p>
                        <p className="mt-1 text-[10px] text-[#718078]">{route?.zone || 'No route assigned'}</p>
                      </article>
                    )
                  })}
                </div>
              ) : <p className="py-8 text-center text-sm text-[#748178]">No vehicles found.</p>}
            </Panel>
          </div>

          <div className="space-y-4 xl:col-span-4">
            <Panel title="Today’s collection status" eyebrow="Service progress"
              action={<Link to="/admin/collections" className="text-xs font-semibold text-[#71d88b] hover:text-white">Collections</Link>}>
              <div className="flex items-center gap-4 py-4">
                <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full"
                  style={{ background: `conic-gradient(#42c75d ${stopProgress}%, #28322b ${stopProgress}% 100%)` }}>
                  <div className="grid h-[84px] w-[84px] place-items-center rounded-full bg-[#111814] text-center">
                    <div><p className="text-2xl font-extrabold">{stopProgress}%</p><p className="text-[9px] text-[#829087]">completed</p></div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div><p className="text-xl font-bold">{number(totalRuns)}</p><p className="text-[10px] text-[#829087]">route runs today</p></div>
                  <div><p className="text-xl font-bold">{number(summary.stops_pending)}</p><p className="text-[10px] text-[#829087]">stops remaining</p></div>
                </div>
              </div>
              <div className="space-y-2 border-t border-white/[0.06] pt-4">
                {['completed', 'in_progress', 'delayed', 'not_started'].map((status) => (
                  <div key={status} className="flex items-center justify-between text-xs">
                    <span className="capitalize text-[#9daa9f]">{status.replaceAll('_', ' ')}</span>
                    <span className="font-semibold">{number(runCounts[status])}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Compliance & service log" eyebrow="Recent community activity"
              action={<Link to="/admin/compliance" className="text-xs font-semibold text-[#71d88b] hover:text-white">View all</Link>}>
              {attentionItems.length ? (
                <ul className="space-y-1">
                  {attentionItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <li key={item.id}>
                        <Link to={item.href} className="flex gap-3 rounded-lg px-2 py-2 transition hover:bg-white/[0.04]">
                          <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#183321] text-[#71d88b]"><Icon size={14} /></span>
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-1.5"><span className="truncate text-[11px] font-semibold capitalize">{item.label.replaceAll('_', ' ')}</span><StatusPill status={item.status} /></span>
                            <span className="mt-1 block line-clamp-1 text-[10px] text-[#829087]">{item.detail}</span>
                            <time className="mt-1 block text-[9px] text-[#718078]">{item.date ? new Date(item.date).toLocaleString() : ''}</time>
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              ) : <p className="py-8 text-center text-sm text-[#748178]">No complaints or compliance reports yet.</p>}
            </Panel>
          </div>
        </div>

        <UpcomingSchedules schedules={schedules} today={summary.today} />
      </div>

      <Panel title="Today’s overview" eyebrow="Operational totals">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[
            { label: 'Active routes', value: summary.active_routes, detail: `${routes.length} routes in the system`, icon: RouteIcon, color: 'text-[#71d88b]' },
            { label: 'Collections completed', value: completedStops, detail: `${number(summary.stops_pending)} stops remaining`, icon: CheckCircle2, color: 'text-[#79b9ff]' },
            { label: 'Open complaints', value: openComplaints, detail: `${complaints.length} reports recorded`, icon: MessageSquareWarning, color: 'text-[#f4c35d]' },
            { label: 'Compliance requiring review', value: openViolations, detail: `${violations.length} reports recorded`, icon: ShieldCheck, color: 'text-[#c2a9ff]' },
          ].map(({ label, value, detail, icon: Icon, color }) => (
            <article key={label} className="rounded-xl border border-white/[0.05] bg-[#0b100d] p-3 sm:p-4">
              <div className="flex items-center gap-2"><Icon size={15} className={color} /><p className="text-[10px] text-[#829087] sm:text-xs">{label}</p></div>
              <p className="mt-2 text-2xl font-extrabold">{number(value)}</p>
              <p className="mt-1 text-[9px] text-[#718078] sm:text-[10px]">{detail}</p>
            </article>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-12">
        <Panel title="Collection analytics" eyebrow="Completed stops" className="xl:col-span-7"
          action={<Link to="/admin/analytics" className="inline-flex items-center gap-1 text-xs font-semibold text-[#71d88b] hover:text-white">Analytics <ArrowUpRight size={14} /></Link>}>
          <CollectionTrend analytics={analytics} />
        </Panel>
        <Panel title="Waste stream schedules" eyebrow="Active collection plans" className="xl:col-span-5"
          action={<Link to="/admin/schedules" className="text-xs font-semibold text-[#71d88b] hover:text-white">Schedules</Link>}>
          <ScheduleMix schedules={schedules} />
          <p className="mt-4 flex items-center gap-1.5 border-t border-white/[0.06] pt-3 text-[10px] text-[#718078]">
            <Leaf size={12} className="shrink-0 text-[#58c875]" />
            Schedule counts by waste type, not measured waste volume.
          </p>
        </Panel>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 px-1 text-[10px] text-[#718078]">
        <span>{number(activeVehicles)} active vehicles · {number(personnel.total)} collectors listed</span>
        <span>Data from your EcoSchedule records</span>
      </footer>
    </div>
  )
}
