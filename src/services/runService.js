import api from './api'

export const runService = {
  // admin
  list: ({ date, status, routeId, limit = 20, offset = 0 } = {}) =>
    api.get('/runs', { date, status, route_id: routeId, limit, offset }),
  active: () => api.get('/runs/active'),
  // collector / admin
  my: (today) => api.get('/runs/my', { today }),
  get: (id) => api.get(`/runs/${id}`),
  start: (data) => api.post('/runs/start', data),
  sendLocation: (id, latitude, longitude) => api.post(`/runs/${id}/location`, { latitude, longitude }),
  updateStop: (id, stopId, data) => api.patch(`/runs/${id}/stops/${stopId}`, data),
  reportDelay: (id, data) => api.post(`/runs/${id}/delay`, data),
  end: (id) => api.post(`/runs/${id}/end`),
  // citizen
  track: (routeId) => api.get('/runs/track', { route_id: routeId }),
}