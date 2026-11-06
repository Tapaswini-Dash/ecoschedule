import { useEffect, useState } from 'react'
import { notificationService } from '../../services/notificationService'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    notificationService.list()
      .then((rows) => { if (active) setNotifications(rows) })
      .catch((requestError) => { if (active) setError(requestError.message || 'Could not load notifications.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  async function markRead(item) {
    try {
      const updated = await notificationService.markRead(item.id)
      setNotifications((rows) => rows.map((row) => row.id === updated.id ? updated : row))
    } catch (requestError) {
      setError(requestError.message || 'Could not mark the notification as read.')
    }
  }

  return (
    <div className="space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">Notifications</h2>
        <p className="mt-1 text-sm text-muted">Account updates saved for you by the municipal service.</p>
      </header>
      {error && <p role="alert" className="rounded-lg border border-bad/40 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
      {loading ? <p className="py-8 text-center text-muted">Loading notifications…</p> : notifications.length ? (
        <ul className="space-y-2">
          {notifications.map((item) => (
            <li key={item.id} className={`rounded-xl border p-4 ${item.is_read ? 'border-line bg-panel' : 'border-leaf/40 bg-panel-2'}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">{item.title}</h3>
                  <p className="mt-1 text-sm">{item.message}</p>
                  <p className="mt-2 text-xs capitalize text-muted">{item.kind.replaceAll('_', ' ')} · {new Date(item.created_at).toLocaleString()}</p>
                </div>
                {!item.is_read && <button onClick={() => markRead(item)} className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold">Mark read</button>}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">You have no notifications.</p>}
    </div>
  )
}