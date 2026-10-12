import { useEffect, useRef } from 'react';
import { useCountdown } from '../../hooks/useCountdown.js';

/** Visual countdown to the backend `expiresAt`. The server alone decides validity; onElapsed just triggers a refetch. */
export default function ReservationCountdown({ createdAt, expiresAt, onElapsed, size = 'lg' }) {
  const { msLeft, label, done } = useCountdown(expiresAt);
  const fired = useRef(false);
  useEffect(() => {
    if (done && !fired.current) { fired.current = true; const t = setTimeout(() => onElapsed?.(), 1200); return () => clearTimeout(t); }
    if (!done) fired.current = false;
    return undefined;
  }, [done, onElapsed]);
  const total = new Date(expiresAt).getTime() - new Date(createdAt).getTime();
  const pct = total > 0 ? Math.min(100, Math.max(0, (msLeft / total) * 100)) : 0;
  const tone = pct < 20 ? 'danger' : pct < 50 ? 'warn' : 'ok';
  return (
    <div className={`rcd rcd-${size} rcd-${tone}`} role="timer" aria-live="off" aria-label={`Time left to arrive: ${label}`}>
      <div className="rcd-time num">{done ? '00:00' : label}</div>
      <div className="rcd-bar"><span style={{ width: `${pct}%` }} /></div>
      <div className="rcd-note">{done ? 'Arrival window ended' : 'left to arrive'}</div>
    </div>
  );
}
