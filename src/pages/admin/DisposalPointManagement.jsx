import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { disposalPointService } from '../../services/disposalPointService'

const empty = { name: '', address: '', latitude: '', longitude: '', accepted_waste_types: '', opening_hours: '', contact: '', description: '' }

export default function DisposalPointManagement() {
  const [points, setPoints] = useState([])
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    disposalPointService.list({ includeInactive: true })
      .then((rows) => { if (active) setPoints(rows) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load disposal points.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  async function createPoint(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await disposalPointService.create({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        accepted_waste_types: form.accepted_waste_types.split(',').map((value) => value.trim()).filter(Boolean),
        opening_hours: form.opening_hours || null,
        contact: form.contact || null,
        description: form.description || null,
      })
      setForm(empty)
      setLoading(true)
      setRevision((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Could not create the disposal point.')
    } finally {
      setBusy(false)
    }
  }

  async function deactivate(point) {
    if (!window.confirm(`Deactivate ${point.name}?`)) return
    try {
      await disposalPointService.remove(point.id)
      setPoints((rows) => rows.map((row) => row.id === point.id ? { ...row, is_active: false } : row))
    } catch (requestError) {
      setError(requestError.message || 'Could not deactivate the disposal point.')
    }
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'address', header: 'Address' },
    { key: 'accepted_waste_types', header: 'Accepted waste', render: (row) => row.accepted_waste_types.join(', ') || 'Not specified' },
    { key: 'location', header: 'Coordinates', render: (row) => `${row.latitude}, ${row.longitude}` },
    { key: 'is_active', header: 'Status', render: (row) => row.is_active ? 'Active' : 'Inactive' },
    { key: 'actions', header: '', render: (row) => row.is_active ? (
      <button onClick={() => deactivate(row)} className="rounded border border-line px-2 py-1 text-xs">Deactivate</button>
    ) : '—' },
  ]

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-extrabold">Disposal points</h2>
        <p className="mt-1 text-sm text-muted">Maintain municipal drop-off locations. Locations are stored in PostgreSQL.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <form onSubmit={createPoint} className="grid gap-3 rounded-xl border border-line bg-panel p-4 md:grid-cols-2 xl:grid-cols-3">
        <input required placeholder="Point name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input required placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input required type="number" step="any" min="-90" max="90" placeholder="Latitude" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input required type="number" step="any" min="-180" max="180" placeholder="Longitude" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input placeholder="Accepted waste types (comma-separated)" value={form.accepted_waste_types} onChange={(event) => setForm({ ...form, accepted_waste_types: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input placeholder="Opening hours" value={form.opening_hours} onChange={(event) => setForm({ ...form, opening_hours: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input placeholder="Contact" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <button disabled={busy} className="rounded-lg bg-forest px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Add disposal point'}</button>
      </form>
      <DataTable columns={columns} rows={points} loading={loading} error={null}
        emptyTitle="No disposal points" emptyMessage="Add a location to publish it to citizens." />
    </div>
  )
}