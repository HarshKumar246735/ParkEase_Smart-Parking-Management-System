import api, { unwrap } from './api.js';
export const vehicleService = {
  list: () => unwrap(api.get('/vehicles')),
  create: (body) => unwrap(api.post('/vehicles', body)),
  update: (id, body) => unwrap(api.put(`/vehicles/${id}`, body)),
  remove: (id) => unwrap(api.delete(`/vehicles/${id}`)),
};
