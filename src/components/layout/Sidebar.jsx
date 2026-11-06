import { NavLink } from 'react-router-dom'
import { Leaf } from 'lucide-react'

export default function Sidebar({ items, open, onClose }) {
  return (
    <>
      {/* backdrop for mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-line bg-panel
        transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center gap-2.5 px-5 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-forest">
            <Leaf size={20} />
          </span>
          <div>
            <p className="text-lg font-extrabold leading-none">EcoSchedule</p>
            <p className="text-xs text-muted">Municipal operations</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/admin' || path === '/collector' || path === '/citizen'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'bg-forest text-white' : 'text-muted hover:bg-panel-2 hover:text-text'
                }`}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="m-3 rounded-lg border border-line bg-ink p-3 text-xs">
          <p className="font-semibold text-ok">Connected workspace</p>
          <p className="mt-0.5 text-muted">Records load from the municipal API.</p>
        </div>
      </aside>
    </>
  )
}