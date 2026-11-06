import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { runService } from '../../services/runService'
import { scheduleService } from '../../services/scheduleService'
import { formatWasteType } from '../../utils/formatWasteType'

export default function MySchedule() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    runService.my(true)
      .then(async (runs) => {
        const routeIds = [...new Set(runs.map((run) => run.route_id))]
        const rows = (await Promise.all(routeIds.map((routeId) => scheduleService.list({ routeId })))).flat()
        if (active) setSchedules(rows)
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load your schedules.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const columns = [
    { key: 'route_code', header: 'Route' },
    { key: 'zone', header: 'Zone' },
    { key: 'waste_type', header: 'Waste type', render: (row) => formatWasteType(row.waste_type) },
    { key: 'days_of_week', header: 'Days', render: (row) => row.days_of_week.map((day) => ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][day]).join(', ') },
    { key: 'window_start', header: 'Time window', render: (row) => `${row.window_start}–${row.window_end}` },
  ]

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">My schedule</h2>
        <p className="mt-1 text-sm text-muted">Schedules for routes with runs assigned to your account today.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <DataTable columns={columns} rows={schedules} loading={loading} error={null}
        emptyTitle="No schedules for your runs" emptyMessage="No route runs are assigned to your account today." />
    </div>
  )
}