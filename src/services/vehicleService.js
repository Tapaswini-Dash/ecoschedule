import api from './api'

export const vehicleService = {
  list: ({ status } = {}) => api.get('/vehicles', { status }),
  get: (id) => api.get(`/vehicles/${id}`),
  lastLocation: (id) => api.get(`/vehicles/${id}/last-location`),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.patch(`/vehicles/${id}`, data),
  remove: (id) => api.del(`/vehicles/${id}`), // = off_duty + unassign
}