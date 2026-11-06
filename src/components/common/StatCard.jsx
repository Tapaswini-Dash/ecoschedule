const BAR = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', info: 'bg-info' }

export default function StatCard({ label, value, hint, tone = 'ok' }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-panel p-4">
      <span className={`absolute inset-y-0 left-0 w-1 ${BAR[tone]}`} />
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  )
}