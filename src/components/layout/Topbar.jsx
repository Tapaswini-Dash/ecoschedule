import { LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function Topbar({ title, subtitle, onMenu }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const role = user?.role ? user.role[0].toUpperCase() + user.role.slice(1) : 'Account'

  function signOut() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex items-center gap-3 border-b border-line bg-panel px-4 py-3 lg:px-6">
      <button className="rounded-lg p-2 text-muted hover:bg-panel-2 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu size={20} />
      </button>

      <div className="min-w-0">
        <h1 className="truncate text-lg font-bold">{title}</h1>
        <p className="hidden truncate text-xs text-muted sm:block">{subtitle}</p>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-sm font-bold">A</span>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-semibold">{user?.full_name || role}</p>
          <p className="text-xs text-muted">{role}</p>
        </div>
      </div>
      <button onClick={signOut} type="button" className="rounded-lg p-2 text-muted hover:bg-panel-2 hover:text-text" aria-label="Sign out" title="Sign out">
        <LogOut size={18} />
      </button>
    </header>
  )
}