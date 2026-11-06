import api from './api'

export const disposalPointService = {
  list: ({ includeInactive = false } = {}) => api.get('/disposal-points', { include_inactive: includeInactive }),
  create: (data) => api.post('/disposal-points', data),
  update: (id, data) => api.patch(`/disposal-points/${id}`, data),
  remove: (id) => api.del(`/disposal-points/${id}`),
}
