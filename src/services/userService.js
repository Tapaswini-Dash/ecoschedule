import api from './api'

export const userService = {
  list: ({ role, q, limit = 20, offset = 0 } = {}) => api.get('/users', { role, q, limit, offset }),
  update: (id, data) => api.patch(`/users/${id}`, data), // full_name, phone, is_active
}