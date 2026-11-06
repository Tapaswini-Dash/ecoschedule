export default function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="rounded-xl border border-dashed border-line p-10 text-center">
      <p className="text-base font-bold text-text">{title}</p>
      {message && <p className="mt-1 text-sm text-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}