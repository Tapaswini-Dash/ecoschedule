import { useEffect, useState } from 'react'
import { complaintService } from '../../services/complaintService'
import { routeService } from '../../services/routeService'

export default function ReportMissedCollection() {
  const [routes, setRoutes] = useState([])
  const [form, setForm] = useState({ route_id: '', description: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    routeService.list({ activeOnly: true })
      .then((rows) => { if (active) setRoutes(rows) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load routes.') })
    return () => { active = false }
  }, [])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await complaintService.create({
        category: 'missed_collection',
        route_id: form.route_id ? Number(form.route_id) : null,
        description: form.description.trim(),
      })
      setForm({ route_id: '', description: '' })
      setNotice('Your report was submitted and saved.')
    } catch (requestError) {
      setError(requestError.message || 'Could not submit the report.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Report a missed collection</h2>
        <p className="mt-1 text-sm text-muted">Your report is saved to the municipal system and can be tracked under My complaints.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{notice}</p>}
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-panel p-4">
        <label className="block text-sm text-muted">Route (optional)
          <select value={form.route_id} onChange={(event) => setForm({ ...form, route_id: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text">
            <option value="">Unknown / not listed</option>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.code} — {route.zone}</option>)}
          </select>
        </label>
        <label className="block text-sm text-muted">What happened?
          <textarea required minLength={5} maxLength={4000} rows={5} value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <button disabled={busy} className="rounded-lg bg-forest px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit report'}</button>
      </form>
    </div>
  )
}