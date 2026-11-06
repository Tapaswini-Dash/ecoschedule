import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

// Reusable for all roles: pass a different `nav`, `title` and `subtitle`.
export default function DashboardLayout({ nav, title, subtitle, children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex h-full">
      <Sidebar items={nav} open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} subtitle={subtitle} onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}