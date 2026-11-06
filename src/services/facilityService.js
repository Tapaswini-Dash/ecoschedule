import api from './api'

export const facilityService = {
  list: ({ includeInactive = false } = {}) => api.get('/waste-facilities', { include_inactive: includeInactive }),
  create: (data) => api.post('/waste-facilities', data),
  update: (id, data) => api.patch(`/waste-facilities/${id}`, data),
  remove: (id) => api.del(`/waste-facilities/${id}`),
}