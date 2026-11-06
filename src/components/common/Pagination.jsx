import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ total, limit, offset, onChange }) {
  if (!total) return null
  const from = offset + 1
  const to = Math.min(offset + limit, total)
  const prev = offset > 0
  const next = offset + limit < total
  const btn = 'rounded-lg border border-line p-1.5 text-text hover:bg-panel-2 disabled:opacity-40'
  return (
    <div className="flex items-center justify-between pt-3 text-sm text-muted">
      <span>{from}–{to} of {total}</span>
      <div className="flex gap-2">
        <button className={btn} disabled={!prev} onClick={() => onChange(Math.max(0, offset - limit))} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>
        <button className={btn} disabled={!next} onClick={() => onChange(offset + limit)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}