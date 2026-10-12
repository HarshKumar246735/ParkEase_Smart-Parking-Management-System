import api, { unwrap } from './api.js';
export const dashboardService = {
  user: () => unwrap(api.get('/dashboard/user')),
  admin: (params) => unwrap(api.get('/dashboard/admin', { params })),
};
