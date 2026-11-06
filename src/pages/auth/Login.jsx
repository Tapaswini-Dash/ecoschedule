import { useState } from 'react'
import { ArrowRight, Leaf, ShieldCheck, Truck, UserRound } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import loginBackground from '../../assets/images/Login.jpeg'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/authService'

const roles = [
  { value: 'citizen', label: 'Citizen', icon: UserRound, detail: 'Collection schedules and community services' },
  { value: 'collector', label: 'Collector', icon: Truck, detail: 'Assigned routes and collection tasks' },
  { value: 'admin', label: 'Administrator', icon: ShieldCheck, detail: 'Municipal operations and management' },
]

const homeByRole = { admin: '/admin', collector: '/collector', citizen: '/citizen' }

export default function Login() {
  const { user, loading, login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState('citizen')
  const [registering, setRegistering] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '' })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  if (loading) return <div className="grid min-h-screen place-items-center text-muted">Checking your session…</div>
  if (user) return <Navigate to={homeByRole[user.role] || '/login'} replace />

  async function submit(event) {
    event.preventDefault()
    setError('')
    setNotice('')
    setBusy(true)
    try {
      if (registering) {
        if (role !== 'citizen') throw new Error('Public registration is available for citizens only. Ask an administrator to create staff accounts.')
        await authService.register({
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone || null,
          password: form.password,
        })
        const signedInUser = await login(form.email, form.password, 'citizen')
        navigate(homeByRole[signedInUser.role] || '/login', { replace: true })
      } else {
        const signedInUser = await login(form.email.trim(), form.password, role)
        navigate(homeByRole[signedInUser.role] || '/login', { replace: true })
      }
    } catch (requestError) {
      setError(requestError.message || 'Unable to complete the request.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main
      className="grid min-h-screen bg-cover bg-center bg-no-repeat lg:grid-cols-[1.05fr_0.95fr]"
      style={{
        backgroundImage: `linear-gradient(rgba(8, 24, 13, 0.55), rgba(8, 24, 13, 0.55)), url("${loginBackground}")`,
      }}
    >
      <section className="relative hidden overflow-hidden px-12 py-10 lg:flex lg:flex-col lg:justify-between">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-white">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b2f14] text-white"><Leaf size={22} /></span>
          EcoSchedule
        </Link>
        <div className="relative z-10 max-w-xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#a6e5ad]">Cleaner streets. Smarter schedules.</p>
          <h1 className="text-5xl font-extrabold leading-tight text-white">Waste services, connected to your community.</h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/85">
            Sign in to manage collections, follow assigned work, or find the right municipal service for your neighborhood.
          </p>
        </div>
        <p className="relative z-10 text-sm text-white/75">Role access is verified by your account. Staff accounts are created by an administrator.</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-lg rounded-3xl border border-white/45 bg-white/35 p-6 shadow-[0_24px_70px_-35px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-9">
          <div className="mb-8 lg:hidden">
            <Link to="/" className="flex items-center gap-2 font-extrabold text-[#102f17]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#15391e] text-white"><Leaf size={22} /></span>
              EcoSchedule
            </Link>
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#48a45a]">{registering ? 'Create your account' : 'Welcome back'}</p>
          <h2 className="mt-2 text-3xl font-extrabold text-[#0c1c11]">{registering ? 'Join EcoSchedule' : 'Sign in to continue'}</h2>
          <p className="mt-2 text-sm leading-6 text-[#718273]">Select your account role. It must match the role assigned to your account.</p>

          <div className="mt-6 grid grid-cols-3 gap-2" role="group" aria-label="Choose account role">
            {roles.map(({ value, label, icon: Icon }) => (
              <button
                type="button"
                key={value}
                disabled={registering && value !== 'citizen'}
                onClick={() => { setRole(value); setError('') }}
                aria-pressed={role === value}
                className={`flex min-h-20 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  role === value ? 'border-[#1c4626] bg-white/45 text-[#123119] ring-2 ring-[#309447]/15' : 'border-white/45 bg-white/15 text-[#526b56] hover:bg-white/30'
                }`}
              >
                <Icon size={20} />
                {label}
              </button>
            ))}
          </div>

          {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-800">{notice}</p>}

          <form onSubmit={submit} className="mt-5 space-y-4">
            {registering && (
              <>
                <label className="block text-sm font-semibold text-[#385a3e]">
                  Full name
                  <input required minLength={2} maxLength={120} autoComplete="name" value={form.full_name}
                    onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#dce8da] px-3.5 py-3 font-normal outline-none focus:border-[#309447] focus:ring-2 focus:ring-[#309447]/15" />
                </label>
                <label className="block text-sm font-semibold text-[#385a3e]">
                  Phone (optional)
                  <input autoComplete="tel" value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-[#dce8da] px-3.5 py-3 font-normal outline-none focus:border-[#309447] focus:ring-2 focus:ring-[#309447]/15" />
                </label>
              </>
            )}
            <label className="block text-sm font-semibold text-[#385a3e]">
              Email address
              <input required type="email" autoComplete="email" value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-[#dce8da] px-3.5 py-3 font-normal outline-none focus:border-[#309447] focus:ring-2 focus:ring-[#309447]/15" />
            </label>
            <label className="block text-sm font-semibold text-[#385a3e]">
              Password
              <input required minLength={8} maxLength={72} type="password" autoComplete={registering ? 'new-password' : 'current-password'}
                value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })}
                className="mt-1.5 w-full rounded-xl border border-[#dce8da] px-3.5 py-3 font-normal outline-none focus:border-[#309447] focus:ring-2 focus:ring-[#309447]/15" />
            </label>
            <button type="submit" disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d3015] px-4 py-3.5 font-bold text-white shadow-lg shadow-[#2c9a46]/20 transition hover:bg-[#237d39] disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Please wait…' : registering ? 'Create citizen account' : `Sign in as ${roles.find((item) => item.value === role)?.label}`}
              {!busy && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#718273]">
            {registering ? 'Already registered?' : role === 'citizen' ? 'New to EcoSchedule?' : 'Need staff access?'}
            {' '}
            {role !== 'citizen' && !registering ? (
              <span className="font-medium text-[#718273]">Contact an administrator to create your account.</span>
            ) : (
              <button type="button" onClick={() => { const next = !registering; setRegistering(next); if (next) setRole('citizen'); setError(''); setNotice('') }}
                className="font-bold text-[#0c2b13] hover:underline">
                {registering ? 'Sign in' : 'Create an account'}
              </button>
            )}
          </p>
        </div>bro 
      </section>
    </main>
  )
}