import { useId } from 'react'

// options: [{ value, label }]
export default function Select({ label, value, onChange, options, placeholder, error, className = '', ...rest }) {
  const id = useId()
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="mb-1 block text-xs font-semibold text-muted">{label}</label>}
      <select
        id={id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-text outline-none focus:border-leaf"
        {...rest}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-bad">{error}</p>}
    </div>
  )
}