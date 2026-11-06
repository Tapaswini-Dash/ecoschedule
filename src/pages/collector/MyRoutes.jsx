import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { routeService } from '../../services/routeService'
import { runService } from '../../services/runService'

export default function MyRoutes() {
  const [routes, setRoutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    runService.my(false)
      .then(async (runs) => {
        const routeIds = [...new Set(runs.map((run) => run.route_id))]
        const routeRows = await Promise.all(routeIds.map((id) => routeService.get(id)))
        if (active) setRoutes(routeRows)
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load your route history.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const columns = [
    { key: 'code', header: 'Route' },
    { key: 'name', header: 'Name' },
    { key: 'zone', header: 'Zone' },
    { key: 'stops', header: 'Stops', render: (route) => route.stops?.length ?? 0 },
  ]

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">My routes</h2>
        <p className="mt-1 text-sm text-muted">Routes included in collection runs assigned to your account.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <DataTable columns={columns} rows={routes} loading={loading} error={null}
        emptyTitle="No route history" emptyMessage="Routes will appear here after a run is assigned to your account." />
    </div>
  )
}