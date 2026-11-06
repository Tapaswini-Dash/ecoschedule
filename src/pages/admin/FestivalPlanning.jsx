import { useEffect, useState } from 'react'
import DataTable from '../../components/common/DataTable'
import { festivalService } from '../../services/festivalService'

const blank = { name: '', description: '', location: '', starts_at: '', ends_at: '', waste_plan: '' }

export default function FestivalPlanning() {
  const [events, setEvents] = useState([])
  const [form, setForm] = useState(blank)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    festivalService.list()
      .then((rows) => { if (active) setEvents(rows) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load events.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  async function createEvent(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await festivalService.create({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        description: form.description || null,
        waste_plan: form.waste_plan || null,
      })
      setForm(blank)
      setLoading(true)
      setRevision((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Could not create the event.')
    } finally {
      setBusy(false)
    }
  }

  async function removeEvent(item) {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    try {
      await festivalService.remove(item.id)
      setEvents((rows) => rows.filter((row) => row.id !== item.id))
    } catch (requestError) {
      setError(requestError.message || 'Could not delete the event.')
    }
  }

  const columns = [
    { key: 'name', header: 'Event' },
    { key: 'location', header: 'Location' },
    { key: 'starts_at', header: 'Starts', render: (row) => new Date(row.starts_at).toLocaleString() },
    { key: 'ends_at', header: 'Ends', render: (row) => new Date(row.ends_at).toLocaleString() },
    { key: 'waste_plan', header: 'Waste plan', render: (row) => row.waste_plan || '—' },
    { key: 'actions', header: '', render: (row) => <button onClick={() => removeEvent(row)} className="rounded border border-line px-2 py-1 text-xs">Delete</button> },
  ]

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-extrabold">Festival planning</h2>
        <p className="mt-1 text-sm text-muted">Record event locations, dates, and municipal waste plans.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <form onSubmit={createEvent} className="grid gap-3 rounded-xl border border-line bg-panel p-4 md:grid-cols-2">
        <input required placeholder="Event name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <input required placeholder="Location" value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <label className="text-sm text-muted">Starts
          <input required type="datetime-local" value={form.starts_at} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <label className="text-sm text-muted">Ends
          <input required type="datetime-local" value={form.ends_at} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <textarea placeholder="Description (optional)" rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <textarea placeholder="Waste collection plan (optional)" rows={2} value={form.waste_plan} onChange={(event) => setForm({ ...form, waste_plan: event.target.value })} className="rounded-lg border border-line bg-ink px-3 py-2" />
        <button disabled={busy} className="rounded-lg bg-forest px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Add event'}</button>
      </form>
      <DataTable columns={columns} rows={events} loading={loading} error={null}
        emptyTitle="No events planned" emptyMessage="Events you create will be saved here." />
    </div>
  )
}