const RAW = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '')
const BASE = RAW.endsWith('/api/v1') ? RAW : `${RAW}/api/v1`
const TOKEN_KEY = 'ecoschedule_token'
const REQUEST_TIMEOUT_MS = 15000

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export const setToken = (t) => {
  try { localStorage.setItem(TOKEN_KEY, t) } catch { /* ignore */ }
}
export const clearToken = () => {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* ignore */ }
}

let onUnauthorized = null
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

function buildQuery(params) {
  if (!params) return ''
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v)
  })
  const s = q.toString()
  return s ? `?${s}` : ''
}

function errorMessage(data, status) {
  const d = data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map((e) => e.msg || 'Invalid value').join('; ')
  return `Request failed (${status})`
}

async function request(path, { method = 'GET', body, params } = {}) {
  const headers = { Accept: 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res
  try {
    res = await fetch(`${BASE}${path}${buildQuery(params)}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError('The server took too long to respond. Check that the backend is running and PostgreSQL is reachable.', 0)
    }
    throw new ApiError('Cannot reach the server. Is the backend running?', 0)
  } finally {
    clearTimeout(timeoutId)
  }

  let data = null
  if (res.status !== 204) {
    try { data = await res.json() } catch { data = null }
  }

  if (!res.ok) {
    if (res.status === 401 && token && !path.startsWith('/auth/login')) {
      clearToken()
      if (onUnauthorized) onUnauthorized()
    }
    throw new ApiError(errorMessage(data, res.status), res.status, data)
  }
  return data
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body) => request(path, { method: 'POST', body: body ?? {} }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
}

export default api