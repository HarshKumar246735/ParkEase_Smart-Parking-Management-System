import api, { unwrap } from './api.js';
export const reservationService = {
  create: (body) => unwrap(api.post('/reservations', body)),
  mine: (params) => unwrap(api.get('/reservations/my', { params })),
  get: (id) => unwrap(api.get(`/reservations/${id}`)),
  cancel: (id) => unwrap(api.delete(`/reservations/${id}`)),
  checkIn: (id) => unwrap(api.post(`/reservations/${id}/check-in`)),
};
