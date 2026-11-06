import { useEffect, useState } from 'react'
import { complianceService } from '../../services/complianceService'
import { routeService } from '../../services/routeService'

export default function ReportViolation() {
  const [routes, setRoutes] = useState([])
  const [form, setForm] = useState({ category: '', severity: 'medium', description: '', route_id: '' })
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
      await complianceService.reportViolation({
        ...form,
        route_id: form.route_id ? Number(form.route_id) : null,
      })
      setForm({ category: '', severity: 'medium', description: '', route_id: '' })
      setNotice('Compliance report saved.')
    } catch (requestError) {
      setError(requestError.message || 'Could not submit the report.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Report a compliance issue</h2>
        <p className="mt-1 text-sm text-muted">This report is saved for municipal review.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{notice}</p>}
      <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-panel p-4">
        <label className="block text-sm text-muted">Category
          <input required minLength={2} maxLength={40} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <label className="block text-sm text-muted">Severity
          <select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text">
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
          </select>
        </label>
        <label className="block text-sm text-muted">Route (optional)
          <select value={form.route_id} onChange={(event) => setForm({ ...form, route_id: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text">
            <option value="">Not route-specific</option>
            {routes.map((route) => <option key={route.id} value={route.id}>{route.code} · {route.zone}</option>)}
          </select>
        </label>
        <label className="block text-sm text-muted">Details
          <textarea required minLength={5} maxLength={4000} rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <button disabled={busy} className="rounded-lg bg-forest px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Submit report'}</button>
      </form>
    </div>
  )
}