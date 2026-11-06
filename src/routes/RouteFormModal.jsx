import { useState } from 'react'
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import Modal from '../components/common/Modal'
import TextField from '../components/common/TextFiels'
import RouteMap from '../components/maps/RouteMap'
import { routeService } from '../services/routeService'

let seq = 0
const newKey = () => `new-${++seq}`

const toForm = (route) => ({
  code: route?.code ?? '',
  name: route?.name ?? '',
  zone: route?.zone ?? '',
  stops: (route?.stops ?? [])
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
    .map((s) => ({
      key: String(s.id), id: s.id, name: s.name,
      latitude: String(s.latitude ?? ''), longitude: String(s.longitude ?? ''),
    })),
})

const num = (v) => (v === '' || v === null ? NaN : Number(v))

function validate(f) {
  if (!f.code.trim()) return 'Route code is required'
  if (!f.zone.trim()) return 'Zone / ward is required'
  if (f.stops.length === 0) return 'Add at least one stop'
  for (const [i, s] of f.stops.entries()) {
    const n = i + 1
    if (!s.name.trim()) return `Stop ${n}: name is required`
    const lat = num(s.latitude), lng = num(s.longitude)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) return `Stop ${n}: latitude must be between -90 and 90`
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) return `Stop ${n}: longitude must be between -180 and 180`
  }
  return null
}

export default function RouteFormModal({ open, route, onClose, onSaved }) {
  const isEdit = Boolean(route)
  const [form, setForm] = useState(() => toForm(route))
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const setStop = (i, patch) =>
    setForm((f) => ({ ...f, stops: f.stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) }))
  const addStop = () =>
    set({ stops: [...form.stops, { key: newKey(), name: '', latitude: '', longitude: '' }] })
  const removeStop = (i) => set({ stops: form.stops.filter((_, idx) => idx !== i) })
  const move = (i, d) => {
    const j = i + d
    if (j < 0 || j >= form.stops.length) return
    const stops = form.stops.slice()
    ;[stops[i], stops[j]] = [stops[j], stops[i]]
    set({ stops })
  }

  async function save() {
    const problem = validate(form)
    if (problem) return setError(problem)
    setError(null)
    setBusy(true)

    const routeData = { code: form.code.trim(), name: form.name.trim() || null, zone: form.zone.trim() }
    let routeId = route?.id
    try {
      if (isEdit) await routeService.update(routeId, routeData)
      else routeId = (await routeService.create(routeData)).id
    } catch (e) {
      setBusy(false)
      return setError(e.message)
    }

    // Stops: deletes first, then updates, then adds. Collect errors instead of stopping.
    const problems = []
    const keptIds = new Set(form.stops.filter((s) => s.id).map((s) => s.id))
    const payload = (s, i) => ({
      name: s.name.trim(), latitude: Number(s.latitude), longitude: Number(s.longitude), sequence: i + 1,
    })
    for (const old of route?.stops ?? []) {
      if (!keptIds.has(old.id)) {
        try { await routeService.removeStop(old.id) }
        catch (e) { problems.push(`Could not remove "${old.name}": ${e.message}`) }
      }
    }
    for (const [i, s] of form.stops.entries()) {
      try {
        if (s.id) await routeService.updateStop(s.id, payload(s, i))
        else await routeService.addStop(routeId, payload(s, i))
      } catch (e) {
        problems.push(`Stop ${i + 1} "${s.name}": ${e.message}`)
      }
    }

    setBusy(false)
    onSaved(problems.length ? `Route saved, but some stops failed. Reopen the route to fix them. ${problems.join(' | ')}` : null)
  }

  const mapStops = form.stops.map((s) => ({ name: s.name, latitude: num(s.latitude), longitude: num(s.longitude) }))
  const cell = 'rounded-lg border border-line bg-ink px-2 py-1.5 text-sm text-text outline-none focus:border-leaf w-full'
  const iconBtn = 'rounded-lg p-1.5 text-muted hover:bg-panel-2 hover:text-text disabled:opacity-30'

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit route ${route.code}` : 'New route'}
      onClose={busy ? undefined : onClose}
      width="max-w-3xl"
      footer={
        <>
          <button onClick={onClose} disabled={busy}
            className="rounded-lg border border-line px-4 py-2 text-sm text-text hover:bg-panel-2 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={save} disabled={busy}
            className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save route'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}

        <div className="grid gap-3 sm:grid-cols-3">
          <TextField label="Route code *" value={form.code} onChange={(e) => set({ code: e.target.value })} placeholder="R-01" />
          <TextField label="Name" value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Saheed Nagar loop" />
          <TextField label="Zone / ward *" value={form.zone} onChange={(e) => set({ zone: e.target.value })} placeholder="Ward 12" />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-bold text-text">Stops (in visiting order)</p>
            <button onClick={addStop} className="flex items-center gap-1 rounded-lg border border-line px-3 py-1.5 text-sm text-text hover:bg-panel-2">
              <Plus size={14} /> Add stop
            </button>
          </div>

          {form.stops.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">No stops yet.</p>
          ) : (
            <div className="space-y-2">
              {form.stops.map((s, i) => (
                <div key={s.key} className="grid grid-cols-[1.5rem_1fr_6rem_6rem_auto] items-center gap-2">
                  <span className="text-center text-xs font-bold text-muted">{i + 1}</span>
                  <input className={cell} placeholder="Stop name" aria-label={`Stop ${i + 1} name`}
                    value={s.name} onChange={(e) => setStop(i, { name: e.target.value })} />
                  <input className={cell} placeholder="Lat" inputMode="decimal" aria-label={`Stop ${i + 1} latitude`}
                    value={s.latitude} onChange={(e) => setStop(i, { latitude: e.target.value })} />
                  <input className={cell} placeholder="Lng" inputMode="decimal" aria-label={`Stop ${i + 1} longitude`}
                    value={s.longitude} onChange={(e) => setStop(i, { longitude: e.target.value })} />
                  <div className="flex">
                    <button className={iconBtn} onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ArrowUp size={14} /></button>
                    <button className={iconBtn} onClick={() => move(i, 1)} disabled={i === form.stops.length - 1} aria-label="Move down"><ArrowDown size={14} /></button>
                    <button className={iconBtn} onClick={() => removeStop(i)} aria-label="Remove stop"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-bold text-text">Map preview</p>
          <RouteMap stops={mapStops} />
        </div>
      </div>
    </Modal>
  )
}