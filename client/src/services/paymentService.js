import api, { unwrap } from './api.js';

export const paymentService = {
  options: () => unwrap(api.get('/payments/options')),
  pay: (body) => unwrap(api.post('/payments/demo', body)),
  history: (params) => unwrap(api.get('/payments/history', { params })),
  get: (id) => unwrap(api.get(`/payments/${id}`)),
  /** Fetches the receipt with the auth header and saves it as a file. */
  async downloadReceipt(id, receiptNumber = 'receipt') {
    const res = await api.get(`/payments/${id}/receipt`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([res.data], { type: 'text/html' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ParkEase-${receiptNumber}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
};
