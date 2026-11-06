import { useState } from 'react'
import { Pencil, Plus, PowerOff } from 'lucide-react'
import useFetch from '../../hooks/useFetch'
import { routeService } from '../../services/routeService'
import DataTable from '../../components/common/DataTable'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import RouteFormModal from '../../routes/RouteFormModal'

const pill = (cls, text) => (
  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{text}</span>
)

export default function RouteManagement() {
  const [showInactive, setShowInactive] = useState(false)
  const { data, loading, error, reload } = useFetch(
    () => routeService.list({ activeOnly: showInactive ? undefined : true }),
    [showInactive],
  )
  const [editing, setEditing] = useState(null)          // null | 'new' | route
  const [deactivating, setDeactivating] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState(null)             // { type: 'ok'|'bad', text }

  async function deactivate() {
    setBusy(true)
    try {
      await routeService.deactivate(deactivating.id)
      setNotice({ type: 'ok', text: `Route ${deactivating.code} deactivated.` })
      setDeactivating(null)
      reload()
    } catch (e) {
      setNotice({ type: 'bad', text: e.message })
      setDeactivating(null)
    } finally {
      setBusy(false)
    }
  }

  const columns = [
    { key: 'code', header: 'Code', render: (r) => <span className="font-bold">{r.code}</span> },
    { key: 'name', header: 'Name' },
    { key: 'zone', header: 'Zone / ward' },
    { key: 'stops', header: 'Stops', render: (r) => r.stops?.length ?? 0 },
    {
      key: 'status', header: 'Status',
      render: (r) => (
        <span className="flex gap-1">
          {r.is_active ? pill('bg-ok/15 text-ok', 'Active') : pill('bg-muted/20 text-muted', 'Inactive')}
        </span>
      ),
    },
    {
      key: 'actions', header: '', className: 'text-right',
      render: (r) => (
        <span className="flex justify-end gap-1">
          <button onClick={() => setEditing(r)} aria-label={`Edit ${r.code}`}
            className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-text"><Pencil size={16} /></button>
          {r.is_active && (
            <button onClick={() => setDeactivating(r)} aria-label={`Deactivate ${r.code}`}
              className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-bad"><PowerOff size={16} /></button>
          )}
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive routes
        </label>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
          <Plus size={16} /> New route
        </button>
      </div>

      {notice && (
        <p role="status" className={`rounded-lg border px-3 py-2 text-sm ${
          notice.type === 'ok' ? 'border-ok/40 bg-ok/10 text-ok' : 'border-bad/40 bg-bad/10 text-bad'}`}>
          {notice.text}
        </p>
      )}

      <DataTable
        columns={columns} rows={data} loading={loading} error={error} onRetry={reload}
        emptyTitle="No routes yet"
        emptyMessage="Create the first route and add its stops."
      />

      {editing && (
        <RouteFormModal
          open
          route={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(warning) => {
            setEditing(null)
            setNotice(warning ? { type: 'bad', text: warning } : { type: 'ok', text: 'Route saved.' })
            reload()
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(deactivating)}
        danger busy={busy}
        title="Deactivate route?"
        message={`Route ${deactivating?.code} will no longer be available for new runs. Past runs and history are kept.`}
        confirmLabel="Deactivate"
        onConfirm={deactivate}
        onCancel={() => setDeactivating(null)}
      />
    </div>
  )
}