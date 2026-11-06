import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { scheduleService } from '../../services/scheduleService'
import { formatWasteType } from '../../utils/formatWasteType'

export default function CitizenCollectionSchedule() {
  const [zone, setZone] = useState('')
  const [query, setQuery] = useState('')
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    scheduleService.list({ zone: query.trim() || undefined })
      .then((rows) => { if (active) setSchedules(rows) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load schedules.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [query, revision])

  const columns = [
    { key: 'route_code', header: 'Route' },
    { key: 'zone', header: 'Zone / ward' },
    { key: 'waste_type', header: 'Waste type', render: (row) => formatWasteType(row.waste_type) },
    { key: 'days_of_week', header: 'Collection days', render: (row) => row.days_of_week.map((day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day]).join(', ') },
    { key: 'window_start', header: 'Collection window', render: (row) => `${row.window_start}–${row.window_end}` },
  ]

  function search(event) {
    event.preventDefault()
    setLoading(true)
    setQuery(zone)
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Collection schedule</h2>
        <p className="mt-1 text-sm text-muted">Look up published collection days and time windows by area.</p>
      </header>
      <form onSubmit={search} className="flex flex-wrap gap-2">
        <input value={zone} onChange={(event) => setZone(event.target.value)} placeholder="Enter ward or zone"
          className="min-w-60 flex-1 rounded-lg border border-line bg-panel px-3 py-2 text-sm text-text" />
        <button className="rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white">Search</button>
        <button type="button" onClick={() => { setZone(''); setQuery(''); setLoading(true); setRevision((value) => value + 1) }}
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">Clear</button>
      </form>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <DataTable columns={columns} rows={schedules.filter((row) => row.is_active)} loading={loading} error={null}
        emptyTitle="No collection schedules" emptyMessage="No active schedules match this area." />
    </div>
  )
}