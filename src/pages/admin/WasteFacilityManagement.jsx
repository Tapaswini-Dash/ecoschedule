import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { facilityService } from '../../services/facilityService'

const empty = { name: '', facility_type: '', address: '', latitude: '', longitude: '', capacity_tonnes: '', contact: '', description: '' }

export default function WasteFacilityManagement() {
  const [facilities, setFacilities] = useState([])
  const [form, setForm] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    facilityService.list({ includeInactive: true })
      .then((rows) => { if (active) setFacilities(rows) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load waste facilities.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  async function createFacility(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await facilityService.create({
        ...form,
        latitude: form.latitude === '' ? null : Number(form.latitude),
        longitude: form.longitude === '' ? null : Number(form.longitude),
        capacity_tonnes: form.capacity_tonnes === '' ? null : Number(form.capacity_tonnes),
        contact: form.contact || null,
        description: form.description || null,
      })
      setForm(empty)
      setLoading(true)
      setRevision((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Could not create the waste facility.')
    } finally {
      setBusy(false)
    }
  }

  async function deactivate(facility) {
    if (!window.confirm(`Deactivate ${facility.name}?`)) return
    try {
      await facilityService.remove(facility.id)
      setFacilities((rows) => rows.map((row) => row.id === facility.id ? { ...row, is_active: false } : row))
    } catch (requestError) {
      setError(requestError.message || 'Could not deactivate the facility.')
    }
  }

  const columns = [
    { key: 'name', header: 'Facility' },
    { key: 'facility_type', header: 'Type' },
    { key: 'address', header: 'Address' },
    { key: 'capacity_tonnes', header: 'Capacity (tonnes)' },
    { key: 'contact', header: 'Contact' },
    { key: 'is_active', header: 'Status', render: (row) => row.is_active ? 'Active' : 'Inactive' },
    { key: 'actions', header: '', render: (row) => row.is_active ? (
      <button onClick={() => deactivate(row)} className="rounded border border-line px-2 py-1 text-xs">Deactivate</button>
    ) : '—' },
  ]

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-extrabold">Waste facilities</h2>
        <p className="mt-1 text-sm text-muted">Manage processing and disposal facilities stored in the database.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <form onSubmit={createFacility} className="grid gap-3 rounded-xl border border-line bg-panel p-4 md:grid-cols-2 xl:grid-cols-3">
        <input required placeholder="Facility name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input required placeholder="Type (recycling, compost…)" value={form.facility_type} onChange={(event) => setForm({ ...form, facility_type: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input required placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input type="number" step="any" min="-90" max="90" placeholder="Latitude (optional)" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input type="number" step="any" min="-180" max="180" placeholder="Longitude (optional)" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input type="number" min="0" step="any" placeholder="Capacity (tonnes)" value={form.capacity_tonnes} onChange={(event) => setForm({ ...form, capacity_tonnes: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input placeholder="Contact" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <button disabled={busy} className="rounded-lg bg-forest px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Add facility'}</button>
      </form>
      <DataTable columns={columns} rows={facilities} loading={loading} error={null}
        emptyTitle="No facilities" emptyMessage="Add a facility to make it available to staff and citizens." />
    </div>
  )
}