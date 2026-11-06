import api from './api'

export const complianceService = {
  listViolations: () => api.get('/compliance/violations'),
  reportViolation: (data) => api.post('/compliance/violations', data),
  updateViolation: (id, data) => api.patch(`/compliance/violations/${id}`, data),
}