import api from './api'

export const scheduleService = {
  list: ({ zone, routeId } = {}) => api.get('/schedules', { zone, route_id: routeId }),
  onDate: (routeId, on) => api.get('/schedules/on-date', { route_id: routeId, on }),
  create: (data) => api.post('/schedules', data),
  update: (id, data) => api.patch(`/schedules/${id}`, data),
  remove: (id) => api.del(`/schedules/${id}`),
  createOverride: (data) => api.post('/schedules/overrides', data),
  removeOverride: (id) => api.del(`/schedules/overrides/${id}`),
}