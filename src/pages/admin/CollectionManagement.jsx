import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { collectionService } from '../../services/collectionService'

const localDate = (date) => {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}
const today = localDate(new Date())

export default function CollectionManagement() {
  const [date, setDate] = useState(today)
  const [status, setStatus] = useState('')
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    collectionService.list({ date: date || undefined, status: status || undefined })
      .then((page) => { if (active) setRecords(page.items) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load collection records.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [date, status, revision])

  const columns = [
    { key: 'run_id', header: 'Run' },
    { key: 'route_code', header: 'Route' },
    { key: 'zone', header: 'Zone' },
    { key: 'stop_name', header: 'Stop', render: (row) => `${row.sequence}. ${row.stop_name}` },
    { key: 'collector_id', header: 'Collector', render: (row) => row.collector_id ? `#${row.collector_id}` : 'Unassigned' },
    { key: 'stop_status', header: 'Collection status', render: (row) => <span className="capitalize">{row.stop_status.replaceAll('_', ' ')}</span> },
    { key: 'visited_at', header: 'Recorded at', render: (row) => row.visited_at ? new Date(row.visited_at).toLocaleString() : '—' },
  ]

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Collection records</h2>
        <p className="mt-1 text-sm text-muted">Stop-level records from route runs. No synthetic collection entries are shown.</p>
      </header>
      <div className="flex flex-wrap gap-3">
        <label className="text-sm text-muted">Date
          <input type="date" value={date} onChange={(event) => { setLoading(true); setDate(event.target.value) }} className="ml-2 rounded-lg border border-line bg-panel px-3 py-2 text-text" />
        </label>
        <label className="text-sm text-muted">Stop status
          <select value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value) }} className="ml-2 rounded-lg border border-line bg-panel px-3 py-2 text-text">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="missed">Missed</option>
          </select>
        </label>
        <button onClick={() => { setLoading(true); setRevision((value) => value + 1) }} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Refresh</button>
      </div>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <DataTable columns={columns} rows={records} loading={loading} error={null}
        emptyTitle="No collection records" emptyMessage="No route stops match the selected date and status." />
    </div>
  )
}