// Keeps the browser clock aligned with the server clock (display only; the server stays authoritative).
let offsetMs = 0;
export function syncServerTime(headerValue) {
  const t = Date.parse(headerValue);
  if (!Number.isNaN(t)) offsetMs = t - Date.now();
}
export const serverNow = () => Date.now() + offsetMs;
