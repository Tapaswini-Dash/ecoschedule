import api from './api'

export const reportService = {
  summary: ({ startDate, endDate } = {}) => api.get('/reports/summary', { start_date: startDate, end_date: endDate }),
}
