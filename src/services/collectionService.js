import api from './api'

export const collectionService = {
  list: ({ date, routeId, status, limit = 50, offset = 0 } = {}) =>
    api.get('/collections', { date, route_id: routeId, status, limit, offset }),
}