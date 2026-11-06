const TONES = {
  ok:   'bg-ok/15 text-ok',
  warn: 'bg-warn/15 text-warn',
  bad:  'bg-bad/15 text-bad',
  info: 'bg-info/15 text-info',
  neutral: 'bg-white/10 text-muted',
}

export default function StatusBadge({ tone = 'neutral', children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  )
}