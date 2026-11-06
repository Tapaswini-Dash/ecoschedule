import { useEffect, useState } from 'react'
import { runService } from '../../services/runService'

export default function ReportIssue() {
  const [runs, setRuns] = useState([])
  const [form, setForm] = useState({ run_id: '', delay_minutes: '15', reason: '', revised_time: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    runService.my(true)
      .then((rows) => { if (active) setRuns(rows.filter((run) => ['in_progress', 'delayed'].includes(run.status))) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load your active runs.') })
    return () => { active = false }
  }, [])

  async function report(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await runService.reportDelay(Number(form.run_id), {
        delay_minutes: Number(form.delay_minutes),
        reason: form.reason.trim(),
        revised_time: form.revised_time || null,
      })
      setNotice('Delay report saved for the selected run.')
    } catch (requestError) {
      setError(requestError.message || 'Could not report the delay.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Report a collection issue</h2>
        <p className="mt-1 text-sm text-muted">Report a delay against one of your active runs.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{notice}</p>}
      <form onSubmit={report} className="space-y-4 rounded-xl border border-line bg-panel p-4">
        <label className="block text-sm text-muted">Active run
          <select required value={form.run_id} onChange={(event) => setForm({ ...form, run_id: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text">
            <option value="">Select a run</option>
            {runs.map((run) => <option key={run.id} value={run.id}>Run #{run.id} · Route #{run.route_id}</option>)}
          </select>
        </label>
        <label className="block text-sm text-muted">Delay (minutes)
          <input required type="number" min="1" max="720" value={form.delay_minutes} onChange={(event) => setForm({ ...form, delay_minutes: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <label className="block text-sm text-muted">Reason
          <textarea required minLength={3} maxLength={300} rows={3} value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <label className="block text-sm text-muted">Revised arrival time (optional)
          <input type="time" value={form.revised_time} onChange={(event) => setForm({ ...form, revised_time: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <button disabled={busy || !runs.length} className="rounded-lg bg-forest px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Submit issue'}</button>
      </form>
    </div>
  )
}