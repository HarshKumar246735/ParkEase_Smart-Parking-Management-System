import { useEffect, useState } from 'react';
import { serverNow } from '../services/clock.js';

/** Counts down to a backend timestamp using the server-synced clock. Display only. */
export function useCountdown(targetIso) {
  const calc = () => (targetIso ? new Date(targetIso).getTime() - serverNow() : 0);
  const [msLeft, setMsLeft] = useState(calc);
  useEffect(() => {
    setMsLeft(calc());
    if (!targetIso) return undefined;
    const id = setInterval(() => setMsLeft(calc()), 500);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetIso]);
  const secondsLeft = Math.max(0, Math.ceil(msLeft / 1000));
  return { msLeft, secondsLeft, done: msLeft <= 0, label: `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}` };
}
