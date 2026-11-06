import LoadingSpinner from './LoadingSpinner'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'

// columns: [{ key, header, render?: (row) => node, className? }]
export default function DataTable({
  columns, rows, rowKey = 'id', loading, error, onRetry,
  emptyTitle, emptyMessage, emptyAction,
}) {
  if (loading) return <LoadingSpinner />
  if (error) return <ErrorState message={error} onRetry={onRetry} />
  if (!rows || rows.length === 0) {
    return <EmptyState title={emptyTitle} message={emptyMessage} action={emptyAction} />
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-panel-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={`px-4 py-3 font-semibold ${c.className || ''}`}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={row[rowKey]} className="hover:bg-panel-2/50">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 text-text ${c.className || ''}`}>
                  {c.render ? c.render(row) : row[c.key] ?? '—'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}