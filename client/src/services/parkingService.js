import api, { unwrap } from './api.js';
export const parkingService = {
  availability: () => unwrap(api.get('/parking/availability')),
  rates: () => unwrap(api.get('/parking/rates')),
  floors: () => unwrap(api.get('/parking/floors')),
  zones: (floorId) => unwrap(api.get(`/parking/floors/${floorId}/zones`)),
  slots: (params) => unwrap(api.get('/parking/slots', { params })),
};
