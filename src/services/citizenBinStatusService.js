import api from './api'

export const citizenBinStatusService = {
  mine: () => api.get('/citizen-bin-status/me'),
  report: (fill_level) => api.post('/citizen-bin-status/me', { fill_level }),
}
