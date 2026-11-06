import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { runService } from '../../services/runService'

export default function LiveOperations() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    runService.active()
      .then((items) => {
        if (active) {
          setRuns(items)
          setError('')
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load active collection runs.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  const columns = [
    { key: 'route_code', header: 'Route' },
    { key: 'zone', header: 'Zone' },
    { key: 'collector_name', header: 'Collector' },
    { key: 'vehicle_id', header: 'Vehicle', render: (run) => run.vehicle_id ? `#${run.vehicle_id}` : 'Unassigned' },
    { key: 'status', header: 'Status', render: (run) => <span className="capitalize">{run.status.replaceAll('_', ' ')}</span> },
    { key: 'progress', header: 'Stops', render: (run) => `${run.stops_completed}/${run.stops_total} completed · ${run.stops_missed} missed` },
    { key: 'location', header: 'Last location', render: (run) => run.location?.available
      ? `${run.location.latitude.toFixed(5)}, ${run.location.longitude.toFixed(5)} · ${run.location.age_minutes} min ago`
      : run.location?.message || 'Unavailable' },
  ]

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Live operations</h2>
          <p className="mt-1 text-sm text-muted">Active runs and last reported collector locations from the API.</p>
        </div>
        <button onClick={() => { setLoading(true); setRevision((value) => value + 1) }} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold hover:bg-panel-2">
          Refresh
        </button>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <DataTable columns={columns} rows={runs} loading={loading} error={null}
        emptyTitle="No active runs" emptyMessage="Active collection runs will appear here when collectors start work." />
      <p className="text-xs text-muted">Positions are the collectors’ last reported locations, not continuous GPS tracking.</p>
    </div>
  )
}