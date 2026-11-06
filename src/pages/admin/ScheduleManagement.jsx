import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import { routeService } from '../../services/routeService'
import { scheduleService } from '../../services/scheduleService'
import { formatWasteType } from '../../utils/formatWasteType'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const emptyForm = { route_id: '', days_of_week: [0, 1, 2, 3, 4, 5, 6], window_start: '07:00', window_end: '10:00', waste_type: 'mixed' }

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState([])
  const [routes, setRoutes] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    Promise.all([scheduleService.list(), routeService.list({ activeOnly: true })])
      .then(([scheduleRows, routeRows]) => {
        if (active) {
          setSchedules(scheduleRows)
          setRoutes(routeRows)
          setError('')
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Could not load schedules.')
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [revision])

  async function createSchedule(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await scheduleService.create({
        ...form,
        route_id: Number(form.route_id),
        days_of_week: form.days_of_week,
      })
      setForm(emptyForm)
      setLoading(true)
      setRevision((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Could not create the schedule.')
    } finally {
      setBusy(false)
    }
  }

  async function deleteSchedule(id) {
    if (!window.confirm('Delete this collection schedule?')) return
    setError('')
    try {
      await scheduleService.remove(id)
      setSchedules((items) => items.filter((item) => item.id !== id))
    } catch (requestError) {
      setError(requestError.message || 'Could not delete the schedule.')
    }
  }

  const columns = [
    { key: 'route_code', header: 'Route' },
    { key: 'zone', header: 'Zone' },
    { key: 'waste_type', header: 'Waste type', render: (row) => formatWasteType(row.waste_type) },
    { key: 'days_of_week', header: 'Collection days', render: (row) => row.days_of_week.map((day) => WEEKDAYS[day]).join(', ') },
    { key: 'window_start', header: 'Time window', render: (row) => `${row.window_start}–${row.window_end}` },
    { key: 'is_active', header: 'Status', render: (row) => row.is_active ? 'Active' : 'Inactive' },
    { key: 'actions', header: '', render: (row) => (
      <button onClick={() => deleteSchedule(row.id)} aria-label={`Delete schedule ${row.id}`} className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-bad">
        <Trash2 size={16} />
      </button>
    ) },
  ]

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-extrabold">Collection schedules</h2>
        <p className="mt-1 text-sm text-muted">Create and maintain schedules stored in the municipal database.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      <form onSubmit={createSchedule} className="grid gap-3 rounded-xl border border-line bg-panel p-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm text-muted">Route
          <select required value={form.route_id} onChange={(event) => setForm({ ...form, route_id: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text">
            <option value="">Select an active route</option>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.code} — {route.zone}</option>)}
          </select>
        </label>
        <label className="text-sm text-muted">Waste type
          <input required maxLength={30} value={form.waste_type} onChange={(event) => setForm({ ...form, waste_type: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <div className="flex items-end gap-3">
          <label className="flex-1 text-sm text-muted">From
            <input required type="time" value={form.window_start} onChange={(event) => setForm({ ...form, window_start: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
          </label>
          <label className="flex-1 text-sm text-muted">Until
            <input required type="time" value={form.window_end} onChange={(event) => setForm({ ...form, window_end: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
          </label>
        </div>
        <fieldset className="md:col-span-2 xl:col-span-3">
          <legend className="mb-2 text-sm text-muted">Collection days</legend>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day, index) => (
              <label key={day} className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm">
                <input type="checkbox" checked={form.days_of_week.includes(index)}
                  onChange={(event) => setForm({
                    ...form,
                    days_of_week: event.target.checked
                      ? [...form.days_of_week, index].sort()
                      : form.days_of_week.filter((value) => value !== index),
                  })} />
                {day}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" disabled={busy || !routes.length} className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
          <Plus size={16} /> {busy ? 'Saving…' : 'Add schedule'}
        </button>
      </form>
      <DataTable columns={columns} rows={schedules} loading={loading} error={null}
        emptyTitle="No schedules" emptyMessage="Create a schedule after adding an active route." />
    </div>
  )
}