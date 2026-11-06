import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { runService } from '../../services/runService'

export default function CollectionHistory() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    runService.my(false)
      .then((items) => { if (active) setRuns(items) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load collection history.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const columns = [
    { key: 'id', header: 'Run' },
    { key: 'route_id', header: 'Route', render: (run) => `#${run.route_id}` },
    { key: 'run_date', header: 'Date' },
    { key: 'status', header: 'Status', render: (run) => <span className="capitalize">{run.status.replaceAll('_', ' ')}</span> },
    { key: 'completed', header: 'Stops completed', render: (run) => run.visits.filter((visit) => visit.status === 'completed').length },
    { key: 'missed', header: 'Stops missed', render: (run) => run.visits.filter((visit) => visit.status === 'missed').length },
  ]

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Collection history</h2>
        <p className="mt-1 text-sm text-muted">Runs recorded for your collector account.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <DataTable columns={columns} rows={runs} loading={loading} error={null}
        emptyTitle="No collection history" emptyMessage="Your recorded runs will appear here." />
    </div>
  )
}