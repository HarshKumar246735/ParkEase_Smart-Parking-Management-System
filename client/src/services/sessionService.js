import api, { unwrap } from './api.js';
export const sessionService = {
  active: () => unwrap(api.get('/parking/sessions/active')),
  history: (params) => unwrap(api.get('/parking/sessions/history', { params })),
  get: (id) => unwrap(api.get(`/parking/sessions/${id}`)),
  bill: (id) => unwrap(api.get(`/parking/sessions/${id}/bill`)),
  leave: (id) => unwrap(api.post(`/parking/sessions/${id}/leave`)),
};
