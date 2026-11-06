import { useId } from 'react'

export default function TextField({ label, error, className = '', ...rest }) {
  const id = useId()
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1 block text-xs font-semibold text-muted">{label}</label>}
      <input
        id={id}
        className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none placeholder:text-muted focus:border-leaf"
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-bad">{error}</p>}
    </div>
  )
}