// Shared card wrapper so every dashboard block has the same header treatment.
export default function Panel({ title, subtitle, action, className = '', children }) {
  return (
    <section className={`rounded-xl border border-line bg-panel p-4 ${className}`}>
      {(title || action) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">{title}</h2>
            {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}