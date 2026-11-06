import api from './api'

export const routeService = {
  list: ({ zone, activeOnly } = {}) => api.get('/routes', { zone, active_only: activeOnly }),
  get: (id) => api.get(`/routes/${id}`),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.patch(`/routes/${id}`, data),
  deactivate: (id) => api.del(`/routes/${id}`),
  addStop: (routeId, data) => api.post(`/routes/${routeId}/stops`, data),
  updateStop: (stopId, data) => api.patch(`/routes/stops/${stopId}`, data),
  removeStop: (stopId) => api.del(`/routes/stops/${stopId}`),
}