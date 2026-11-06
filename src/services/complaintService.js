import api from './api'

export const complaintService = {
  list: () => api.get('/complaints'),
  mine: () => api.get('/complaints/my'),
  create: (data) => api.post('/complaints', data),
  update: (id, data) => api.patch(`/complaints/${id}`, data),
}