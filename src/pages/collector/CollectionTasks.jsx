import { useEffect, useState } from 'react'
import { runService } from '../../services/runService'
import { routeService } from '../../services/routeService'

const stopStatuses = [
  { value: 'completed', label: 'Completed' },
  { value: 'missed', label: 'Missed' },
]

export default function CollectionTasks() {
  const [runs, setRuns] = useState([])
  const [routes, setRoutes] = useState([])
  const [routeId, setRouteId] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([runService.my(true), routeService.list({ activeOnly: true })])
      .then(([myRuns, routeRows]) => {
        if (active) {
          setRuns(myRuns)
          setRoutes(routeRows)
          setError('')
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load collection tasks.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  async function startRun(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await runService.start({ route_id: Number(routeId) })
      setLoading(true)
      setRevision((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Could not start this run.')
    } finally {
      setBusy(false)
    }
  }

  async function updateStop(runId, stopId, status) {
    setError('')
    try {
      await runService.updateStop(runId, stopId, { status })
      setLoading(true)
      setRevision((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Could not update the stop.')
    }
  }

  async function endRun(runId) {
    if (!window.confirm('End this collection run? Pending stops will remain pending.')) return
    setError('')
    try {
      await runService.end(runId)
      setLoading(true)
      setRevision((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Could not end the run.')
    }
  }

  const routeById = new Map(routes.map((route) => [route.id, route]))
  const activeRuns = runs.filter((run) => ['in_progress', 'delayed'].includes(run.status))

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-extrabold">Today’s collection tasks</h2>
        <p className="mt-1 text-sm text-muted">Start a run, record each stop, and finish the run when work is complete.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <form onSubmit={startRun} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-panel p-4">
        <label className="min-w-60 flex-1 text-sm text-muted">Route
          <select required value={routeId} onChange={(event) => setRouteId(event.target.value)} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text">
            <option value="">Select a route</option>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.code} — {route.zone}</option>)}
          </select>
        </label>
        <button disabled={busy || !routeId} className="rounded-lg bg-forest px-4 py-2 font-bold text-white disabled:opacity-50">
          {busy ? 'Starting…' : 'Start run'}
        </button>
      </form>

      {loading ? <p className="py-8 text-center text-muted">Loading your tasks…</p> : activeRuns.length ? (
        <div className="space-y-4">
          {activeRuns.map((run) => (
            <section key={run.id} className="rounded-xl border border-line bg-panel p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold">Run #{run.id} · {routeById.get(run.route_id)?.code || `Route #${run.route_id}`}</h3>
                  <p className="mt-1 text-xs capitalize text-muted">{run.status.replaceAll('_', ' ')}</p>
                </div>
                <button onClick={() => endRun(run.id)} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-panel-2">End run</button>
              </div>
              <ul className="mt-3 divide-y divide-line">
                {run.visits.map((visit) => (
                  <li key={visit.stop_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-sm font-semibold">{visit.sequence}. {visit.stop_name}</p>
                      <p className="text-xs capitalize text-muted">{visit.status.replaceAll('_', ' ')}</p>
                    </div>
                    {visit.status !== 'completed' && visit.status !== 'missed' && (
                      <div className="flex gap-2">
                        {stopStatuses.map((status) => (
                          <button key={status.value} onClick={() => updateStop(run.id, visit.stop_id, status.value)}
                            className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-panel-2">
                            {status.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">You have no active run today. Start a run using an active route.</p>}
    </div>
  )
}