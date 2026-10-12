import { useEffect, useState } from 'react';
import { serverNow } from '../../services/clock.js';
import { formatClock, formatINR } from '../../utils/format.js';

/**
 * Display-only live timer + estimate. Everything is derived from the backend arrivalAt and the
 * rate snapshot, so a refresh / another device shows the same numbers. Final bill is computed by the server.
 */
export function useElapsed(arrivalAt, ratePerMinute) {
  const calc = () => {
    const ms = Math.max(0, serverNow() - new Date(arrivalAt).getTime());
    const minutes = Math.max(1, Math.ceil(ms / 60000));
    return { seconds: Math.floor(ms / 1000), minutes, fee: Math.round(minutes * ratePerMinute * 100) / 100 };
  };
  const [v, setV] = useState(calc);
  useEffect(() => {
    setV(calc());
    const id = setInterval(() => setV(calc()), 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrivalAt, ratePerMinute]);
  return v;
}

export default function ParkingTimer({ arrivalAt, ratePerMinute, compact = false }) {
  const { seconds, minutes, fee } = useElapsed(arrivalAt, ratePerMinute);
  return (
    <div className={`ptimer ${compact ? 'ptimer-compact' : ''}`}>
      <div className="ptimer-block" role="timer" aria-label="Time parked">
        <span className="ptimer-label">Time parked</span>
        <span className="ptimer-clock num">{formatClock(seconds)}</span>
      </div>
      <div className="ptimer-block ptimer-fee">
        <span className="ptimer-label">Estimated charge</span>
        <span className="ptimer-amount num" aria-live="polite">{formatINR(fee)}</span>
        <span className="ptimer-sub">{minutes} billable min x {formatINR(ratePerMinute)}</span>
      </div>
    </div>
  );
}
