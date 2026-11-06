import { useEffect, useState } from 'react'
import { routeService } from '../../services/routeService'
import { runService } from '../../services/runService'
import { formatWasteType } from '../../utils/formatWasteType'

export default function RouteTracking() {
  const [routes, setRoutes] = useState([])
  const [routeId, setRouteId] = useState('')
  const [tracking, setTracking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    routeService.list({ activeOnly: true })
      .then((items) => { if (active) setRoutes(items) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load routes.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function checkRoute(event) {
    event.preventDefault()
    setError('')
    setTracking(null)
    try {
      setTracking(await runService.track(Number(routeId)))
    } catch (requestError) {
      setError(requestError.message || 'Could not load route progress.')
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Routes and collection progress</h2>
        <p className="mt-1 text-sm text-muted">Select a route to see today’s schedule, run progress, and last reported location.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <form onSubmit={checkRoute} className="flex flex-wrap gap-2">
        <select required disabled={loading} value={routeId} onChange={(event) => setRouteId(event.target.value)} className="min-w-64 flex-1 rounded-lg border border-line bg-panel px-3 py-2 text-sm">
          <option value="">Select an active route</option>
          {routes.map((route) => <option key={route.id} value={route.id}>{route.code} — {route.zone}</option>)}
        </select>
        <button disabled={loading || !routeId} className="rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Check progress</button>
      </form>
      {tracking && (
        <section className="space-y-4 rounded-xl border border-line bg-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold">{tracking.route_code} · {tracking.zone}</h3>
              <p className="mt-1 text-sm capitalize text-muted">Today’s run: {tracking.run_status.replaceAll('_', ' ')}</p>
              <p className="mt-1 text-xs text-muted">
                Assigned truck: {tracking.vehicle_registration || 'Not assigned'}
                {tracking.vehicle_type ? ` · ${tracking.vehicle_type}` : ''}
              </p>
            </div>
            <p className="text-sm">Stops: {tracking.stops_completed} completed / {tracking.stops_total} total</p>
          </div>
          {tracking.run_status === 'delayed' && (
            <p role="alert" className="rounded-lg border border-warn/30 bg-warn/10 p-3 text-sm">
              Delay: {tracking.delay_reason || 'The collection truck has reported a delay.'}
              {tracking.delay_minutes ? ` (${tracking.delay_minutes} minutes)` : ''}
              {tracking.delay_revised_time ? ` · Revised time ${tracking.delay_revised_time.slice(0, 5)}` : ''}
            </p>
          )}
          <div className="rounded-lg bg-ink p-3 text-sm">
            <p className="font-semibold">Last reported location</p>
            <p className="mt-1 text-muted">{tracking.location.available
              ? `${tracking.location.latitude}, ${tracking.location.longitude} · ${tracking.location.age_minutes} minutes ago`
              : tracking.location.message}</p>
          </div>
          <div>
            <h4 className="font-semibold">Today’s collection times</h4>
            {tracking.scheduled_today.length ? (
              <ul className="mt-2 space-y-2">
                {tracking.scheduled_today.map((item) => (
                  <li key={item.schedule_id} className="flex flex-wrap justify-between gap-2 text-sm">
                    <span>{formatWasteType(item.waste_type)}{item.cancelled ? ' · Cancelled' : ''}</span>
                    <span className="text-muted">{item.window_start && item.window_end ? `${item.window_start}–${item.window_end}` : item.note || 'No window published'}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">No collection is scheduled for this route today.</p>}
          </div>
          <p className="border-t border-line pt-3 text-xs text-muted">{tracking.disclaimer}</p>
        </section>
      )}
    </div>
  )
}
