import api from './api'

export const festivalService = {
  list: () => api.get('/festivals'),
  create: (data) => api.post('/festivals', data),
  update: (id, data) => api.patch(`/festivals/${id}`, data),
  remove: (id) => api.del(`/festivals/${id}`),
}
