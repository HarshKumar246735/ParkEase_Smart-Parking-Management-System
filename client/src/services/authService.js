import api, { unwrap } from './api.js';
export const authService = {
  register: (body) => unwrap(api.post('/auth/register', body)),
  login: (body) => unwrap(api.post('/auth/login', body)),
  me: () => unwrap(api.get('/auth/me')),
  updateProfile: (body) => unwrap(api.put('/auth/profile', body)),
};
