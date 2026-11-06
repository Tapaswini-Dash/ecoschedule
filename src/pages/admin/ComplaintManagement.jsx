import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { complaintService } from '../../services/complaintService'

export default function ComplaintManagement() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    complaintService.list()
      .then((rows) => { if (active) setComplaints(rows) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load complaints.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  async function changeStatus(complaint, status) {
    if (status === complaint.status) return
    const message = window.prompt(`Add an update for this complaint (${status.replaceAll('_', ' ')}).`)
    if (!message?.trim()) return
    setError('')
    try {
      const updated = await complaintService.update(complaint.id, { status, message: message.trim() })
      setComplaints((rows) => rows.map((row) => row.id === updated.id ? updated : row))
    } catch (requestError) {
      setError(requestError.message || 'Could not update the complaint.')
    }
  }

  const columns = [
    { key: 'id', header: 'ID', render: (row) => `#${row.id}` },
    { key: 'citizen_id', header: 'Citizen', render: (row) => `#${row.citizen_id}` },
    { key: 'category', header: 'Category' },
    { key: 'description', header: 'Details' },
    { key: 'status', header: 'Status', render: (row) => (
      <select aria-label={`Set status for complaint ${row.id}`} value={row.status} onChange={(event) => changeStatus(row, event.target.value)} className="rounded border border-line bg-panel px-2 py-1 capitalize">
        <option value="open">Open</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="rejected">Rejected</option>
      </select>
    ) },
    { key: 'created_at', header: 'Submitted', render: (row) => new Date(row.created_at).toLocaleDateString() },
  ]

  return (
    <div className="space-y-4">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">Citizen complaints</h2>
          <p className="mt-1 text-sm text-muted">Review submissions and record a status update; the citizen is notified.</p>
        </div>
        <button onClick={() => { setLoading(true); setRevision((value) => value + 1) }} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold">Refresh</button>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <DataTable columns={columns} rows={complaints} loading={loading} error={null}
        emptyTitle="No complaints" emptyMessage="Citizen submissions will appear here." />
    </div>
  )
}