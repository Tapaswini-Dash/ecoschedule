import { useEffect, useState } from 'react'
import { analyticsService } from '../../services/analyticsService'
import { reportService } from '../../services/reportService'

const dateValue = (date) => {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export default function OperationsSummary({ report = false }) {
  const [startDate, setStartDate] = useState(() => dateValue(new Date(Date.now() - 29 * 86400000)))
  const [endDate, setEndDate] = useState(() => dateValue(new Date()))
  const [range, setRange] = useState({ startDate: '', endDate: '' })
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const service = report ? reportService : analyticsService
    service[report ? 'summary' : 'operations']({
      startDate: range.startDate || undefined,
      endDate: range.endDate || undefined,
    })
      .then((result) => { if (active) setSummary(result) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load the report.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [range, report])

  function applyRange(event) {
    event.preventDefault()
    setError('')
    setLoading(true)
    setRange({ startDate, endDate })
  }

  const groups = [
    ['Runs', summary?.runs_by_status],
    ['Stops', summary?.stops_by_status],
    ['Complaints', summary?.complaints_by_status],
    ['Violations', summary?.violations_by_status],
  ]

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-extrabold">{report ? 'Operations reports' : 'Operations analytics'}</h2>
        <p className="mt-1 text-sm text-muted">Aggregates calculated from saved route runs, complaints, and compliance reports.</p>
      </header>
      <form onSubmit={applyRange} className="flex flex-wrap items-end gap-3">
        <label className="text-sm text-muted">From<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block rounded-lg border border-line bg-panel px-3 py-2 text-text" /></label>
        <label className="text-sm text-muted">To<input required type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block rounded-lg border border-line bg-panel px-3 py-2 text-text" /></label>
        <button className="rounded-lg bg-forest px-4 py-2 font-bold text-white">Update</button>
      </form>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {loading ? <p className="py-8 text-center text-muted">Calculating from saved records…</p> : summary && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Active routes', summary.active_routes],
              ['Active vehicles', summary.active_vehicles],
              ['Completed stops', summary.total_collections],
              ['Report period', `${summary.start_date} – ${summary.end_date}`],
            ].map(([label, value]) => <article key={label} className="rounded-xl border border-line bg-panel p-4"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-xl font-extrabold">{value}</p></article>)}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {groups.map(([label, values]) => (
              <section key={label} className="rounded-xl border border-line bg-panel p-4">
                <h3 className="font-bold">{label}</h3>
                {Object.keys(values || {}).length ? (
                  <ul className="mt-2 divide-y divide-line">
                    {Object.entries(values).map(([status, count]) => <li key={status} className="flex justify-between py-2 text-sm"><span className="capitalize">{status.replaceAll('_', ' ')}</span><span className="font-bold">{count}</span></li>)}
                  </ul>
                ) : <p className="mt-2 text-sm text-muted">No records in this period.</p>}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
