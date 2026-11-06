import api from './api'

export const notificationService = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`, {}),
}