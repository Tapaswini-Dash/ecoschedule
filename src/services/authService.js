import api, { clearToken, getToken, setToken } from './api'

export const authService = {
  async login(credentials, expectedRole) {
    const result = await api.post('/auth/login', {
      ...credentials,
      email: credentials.email.trim(),
    })
    if (expectedRole && result.user.role !== expectedRole) {
      throw new Error(`This account belongs to the ${result.user.role} role. Select that role to sign in.`)
    }
    setToken(result.access_token)
    return result.user
  },
  register: (data) => api.post('/auth/register', {
    ...data,
    email: data.email.trim(),
  }),
  createStaff: (data) => api.post('/auth/staff', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/users/me', data),
  logout: clearToken,
  hasSession: () => Boolean(getToken()),
}
