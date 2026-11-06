import api from './api'

export const analyticsService = {
  operations: ({ startDate, endDate } = {}) => api.get('/analytics/operations', { start_date: startDate, end_date: endDate }),
}