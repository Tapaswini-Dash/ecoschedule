import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'

export default function CitizenProfile() {
  const { user, updateProfile } = useAuth()
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function save(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await updateProfile({ full_name: form.full_name.trim(), phone: form.phone.trim() || null })
      setNotice('Profile saved.')
    } catch (requestError) {
      setError(requestError.message || 'Could not save your profile.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Your profile</h2>
        <p className="mt-1 text-sm text-muted">Update the contact details associated with your account.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-ok/40 bg-ok/10 px-3 py-2 text-sm text-ok">{notice}</p>}
      <form onSubmit={save} className="space-y-4 rounded-xl border border-line bg-panel p-4">
        <label className="block text-sm text-muted">Full name
          <input required minLength={2} maxLength={120} value={form.full_name}
            onChange={(event) => setForm({ ...form, full_name: event.target.value })}
            className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <label className="block text-sm text-muted">Email
          <input readOnly value={user?.email || ''} className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-muted" />
        </label>
        <label className="block text-sm text-muted">Phone
          <input maxLength={20} autoComplete="tel" value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
            className="mt-1 block w-full rounded-lg border border-line bg-ink px-3 py-2 text-text" />
        </label>
        <button disabled={busy} className="rounded-lg bg-forest px-4 py-2 font-bold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save profile'}</button>
      </form>
    </div>
  )
}