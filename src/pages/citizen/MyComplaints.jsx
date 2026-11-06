import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { complaintService } from '../../services/complaintService'

export default function MyComplaints() {
  const [complaints, setComplaints] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    complaintService.mine()
      .then((rows) => { if (active) setComplaints(rows) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load your complaints.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const columns = [
    { key: 'created_at', header: 'Submitted', render: (row) => new Date(row.created_at).toLocaleDateString() },
    { key: 'category', header: 'Category' },
    { key: 'description', header: 'Details' },
    { key: 'status', header: 'Status', render: (row) => <span className="capitalize">{row.status.replaceAll('_', ' ')}</span> },
    { key: 'updates', header: 'Latest update', render: (row) => row.updates.at(-1)?.message || 'Awaiting review' },
  ]

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">My complaints</h2>
        <p className="mt-1 text-sm text-muted">View your submitted reports and their recorded updates.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <DataTable columns={columns} rows={complaints} loading={loading} error={null}
        emptyTitle="No complaints yet" emptyMessage="Your reports will be listed here after you submit one." />
    </div>
  )
}