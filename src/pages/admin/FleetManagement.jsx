import { useState } from 'react'
import { Pencil, Plus, PowerOff } from 'lucide-react'
import useFetch from '../../hooks/useFetch'
import { vehicleService } from '../../services/vehicleService'
import { routeService } from '../../services/routeService'
import DataTable from '../../components/common/DataTable'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import Modal from '../../components/common/Modal'
import Select from '../../components/common/Select'
import TextField from '../../components/common/TextFiels'

// ASSUMPTION: confirm against `VehicleStatus` in core/enums.py
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'off_duty', label: 'Off duty' },
]
const STATUS_STYLE = { active: 'bg-ok/15 text-ok', maintenance: 'bg-warn/15 text-warn', off_duty: 'bg-muted/20 text-muted' }

function VehicleForm({ vehicle, routes, onClose, onSaved }) {
  const isEdit = Boolean(vehicle)
  const [form, setForm] = useState({
    registration_no: vehicle?.registration_no ?? '',   // ASSUMPTION: field name
    status: vehicle?.status ?? 'active',
    assigned_route_id: vehicle?.assigned_route_id ? String(vehicle.assigned_route_id) : '',
  })
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!form.registration_no.trim()) return setError('Registration number is required')
    setBusy(true); setError(null)
    const body = {
      registration_no: form.registration_no.trim(),
      status: form.status,
      assigned_route_id: form.assigned_route_id ? Number(form.assigned_route_id) : null,
    }
    try {
      if (isEdit) await vehicleService.update(vehicle.id, body)
      else await vehicleService.create(body)
      onSaved()
    } catch (e) {
      setError(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      open title={isEdit ? 'Edit vehicle' : 'New vehicle'} onClose={busy ? undefined : onClose}
      footer={
        <>
          <button onClick={onClose} disabled={busy}
            className="rounded-lg border border-line px-4 py-2 text-sm text-text hover:bg-panel-2 disabled:opacity-50">Cancel</button>
          <button onClick={save} disabled={busy}
            className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">
            {busy ? 'Saving…' : 'Save vehicle'}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
        <TextField label="Registration number *" value={form.registration_no} placeholder="OD-02-AB-1234"
          onChange={(e) => setForm({ ...form, registration_no: e.target.value })} />
        <Select label="Status" value={form.status} options={STATUS_OPTIONS}
          onChange={(v) => setForm({ ...form, status: v })} />
        <Select label="Assigned route" value={form.assigned_route_id} placeholder="Not assigned"
          options={routes.map((r) => ({ value: String(r.id), label: `${r.code}${r.zone ? ` (${r.zone})` : ''}` }))}
          onChange={(v) => setForm({ ...form, assigned_route_id: v })} />
      </div>
    </Modal>
  )
}

export default function FleetManagement() {
  const [statusFilter, setStatusFilter] = useState('')
  const vehicles = useFetch(() => vehicleService.list({ status: statusFilter || undefined }), [statusFilter])
  const routes = useFetch(() => routeService.list({ activeOnly: true }), [])
  const [editing, setEditing] = useState(null)
  const [removing, setRemoving] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)

  const routeLabel = (id) => {
    const r = routes.data?.find((x) => x.id === id)
    return r ? r.code : id ? `Route #${id}` : '—'
  }

  async function takeOffDuty() {
    setBusy(true)
    try {
      await vehicleService.remove(removing.id)
      setNotice({ type: 'ok', text: `${removing.registration_no} set to off duty and unassigned.` })
      setRemoving(null)
      vehicles.reload()
    } catch (e) {
      setNotice({ type: 'bad', text: e.message })
      setRemoving(null)
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'registration_no', header: 'Registration', render: (v) => <span className="font-bold">{v.registration_no}</span> },
    {
      key: 'status', header: 'Status',
      render: (v) => (
        <span className="flex gap-1">
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLE[v.status] || 'bg-muted/20 text-muted'}`}>
            {STATUS_OPTIONS.find((o) => o.value === v.status)?.label ?? v.status}
          </span>
        </span>
      ),
    },
    { key: 'assigned_route_id', header: 'Assigned route', render: (v) => routeLabel(v.assigned_route_id) },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (v) => (
        <span className="flex justify-end gap-1">
          <button onClick={() => setEditing(v)} aria-label={`Edit ${v.registration_no}`}
            className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-text"><Pencil size={16} /></button>
          {v.status !== 'off_duty' && (
            <button onClick={() => setRemoving(v)} aria-label={`Take ${v.registration_no} off duty`}
              className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-bad"><PowerOff size={16} /></button>
          )}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Select className="w-48" value={statusFilter} onChange={setStatusFilter}
          placeholder="All statuses" options={STATUS_OPTIONS} aria-label="Filter by status" />
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus size={16} /> New vehicle
        </button>
      </div>

      {notice && (
        <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${
          notice.type === 'ok' ? 'border-ok/40 bg-ok/10 text-ok' : 'border-bad/40 bg-bad/10 text-bad'}`}>
          {notice.text}
        </p>
      )}

      <DataTable
        columns={columns} rows={vehicles.data} loading={vehicles.loading} error={vehicles.error}
        onRetry={vehicles.reload}
        emptyTitle="No vehicles" emptyMessage="Add a vehicle and assign it to a route."
      />

      {editing && (
        <VehicleForm
          vehicle={editing === 'new' ? null : editing}
          routes={routes.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); setNotice({ type: 'ok', text: 'Vehicle saved.' }); vehicles.reload() }}
        />
      )}

      <ConfirmDialog
        open={Boolean(removing)} danger busy={busy}
        title="Take vehicle off duty?"
        message={`${removing?.registration_no} will be set to off duty and unassigned from its route. History is kept.`}
        confirmLabel="Set off duty"
        onConfirm={takeOffDuty} onCancel={() => setRemoving(null)}
      />
    </div>
  )
}