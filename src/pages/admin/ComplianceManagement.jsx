import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { complianceService } from '../../services/complianceService'

export default function ComplianceManagement() {
  const [violations, setViolations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    complianceService.listViolations()
      .then((rows) => { if (active) setViolations(rows) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load compliance reports.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  async function setStatus(violation, status) {
    if (status === violation.status) return
    const resolution = status === 'resolved' || status === 'dismissed'
      ? window.prompt('Enter the resolution or reason for dismissal:', violation.resolution || '') : null
    if ((status === 'resolved' || status === 'dismissed') && !resolution?.trim()) return
    setError('')
    try {
      const updated = await complianceService.updateViolation(violation.id, { status, resolution: resolution?.trim() || null })
      setViolations((rows) => rows.map((row) => row.id === updated.id ? updated : row))
    } catch (requestError) {
      setError(requestError.message || 'Could not update the report.')
    }
  }

  const columns = [
    { key: 'id', header: 'ID', render: (row) => `#${row.id}` },
    { key: 'category', header: 'Category' },
    { key: 'severity', header: 'Severity', render: (row) => <span className="capitalize">{row.severity}</span> },
    { key: 'description', header: 'Details' },
    { key: 'reported_by_id', header: 'Reported by', render: (row) => `#${row.reported_by_id}` },
    { key: 'status', header: 'Status', render: (row) => (
      <select aria-label={`Set status for report ${row.id}`} value={row.status} onChange={(event) => setStatus(row, event.target.value)} className="rounded border border-line bg-panel px-2 py-1 capitalize">
        <option value="open">Open</option><option value="under_review">Under review</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option>
      </select>
    ) },
  ]

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Compliance reports</h2>
          <p className="mt-1 text-sm text-muted">Collector and administrator reports, with recorded resolution status.</p>
        </div>
        <button onClick={() => { setLoading(true); setRevision((value) => value + 1) }} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Refresh</button>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <DataTable columns={columns} rows={violations} loading={loading} error={null}
        emptyTitle="No compliance reports" emptyMessage="Reports submitted by field staff will appear here." />
    </div>
  )
}