export default function LoadingSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 p-10 text-muted" role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-leaf" />
      <span className="text-sm">{label}</span>
    </div>
  )
}