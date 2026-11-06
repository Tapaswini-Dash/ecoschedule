import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import DataTable from '../../components/common/DataTable'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'
import { userService } from '../../services/userService'

const blank = { full_name: '', email: '', phone: '', password: '', role: 'collector' }

export default function PersonnelManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState(blank)
  const [creating, setCreating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [revision, setRevision] = useState(0)

  useEffect(() => {
    let active = true
    userService.list({ role: filter || undefined, limit: 100 })
      .then((page) => {
        if (active) {
          setUsers(page.items)
          setError('')
        }
      })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load personnel.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [filter, revision])

  async function addStaff(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setCreating(true)
    try {
      await authService.createStaff({ ...form, phone: form.phone || null })
      setForm(blank)
      setNotice('Staff account created.')
      setLoading(true)
      setRevision((value) => value + 1)
    } catch (requestError) {
      setError(requestError.message || 'Could not create the staff account.')
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(person) {
    setError('')
    try {
      await userService.update(person.id, { is_active: !person.is_active })
      setUsers((items) => items.map((item) => item.id === person.id ? { ...item, is_active: !person.is_active } : item))
    } catch (requestError) {
      setError(requestError.message || 'Could not update this account.')
    }
  }

  const columns = [
    { key: 'full_name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (person) => <span className="capitalize">{person.role}</span> },
    { key: 'is_active', header: 'Status', render: (person) => person.is_active ? 'Active' : 'Disabled' },
    { key: 'actions', header: '', render: (person) => person.id === currentUser?.id ? 'Your account' : (
      <button onClick={() => toggleActive(person)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-panel-2">
        {person.is_active ? 'Disable' : 'Enable'}
      </button>
    ) },
  ]

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-2xl font-extrabold">Personnel</h2>
        <p className="mt-1 text-sm text-muted">Create collector/admin accounts and manage access to the system.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{notice}</p>}

      <form onSubmit={addStaff} className="grid gap-3 rounded-xl border border-line bg-panel p-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="text-sm text-muted">Full name
          <input required minLength={2} maxLength={120} value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <label className="text-sm text-muted">Email
          <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <label className="text-sm text-muted">Phone (optional)
          <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <label className="text-sm text-muted">Temporary password
          <input required minLength={8} maxLength={72} type="password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <label className="text-sm text-muted">Role
          <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text">
            <option value="collector">Collector</option>
            <option value="admin">Administrator</option>
          </select>
        </label>
        <button type="submit" disabled={creating} className="inline-flex items-center justify-center gap-2 self-end rounded-lg bg-forest px-4 py-2 font-bold text-white disabled:opacity-50">
          <UserPlus size={16} /> {creating ? 'Creating…' : 'Create staff account'}
        </button>
      </form>

      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold">Accounts</h3>
        <select aria-label="Filter personnel by role" value={filter} onChange={(event) => { setLoading(true); setFilter(event.target.value) }} className="rounded-lg border border-line bg-panel px-3 py-2 text-sm">
          <option value="">All roles</option>
          <option value="admin">Administrators</option>
          <option value="collector">Collectors</option>
          <option value="citizen">Citizens</option>
        </select>
      </div>
      <DataTable columns={columns} rows={users} loading={loading} error={null}
        emptyTitle="No accounts found" emptyMessage="New registrations and staff accounts will appear here." />
    </div>
  )
}