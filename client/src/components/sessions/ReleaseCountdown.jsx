import { useEffect, useRef } from 'react';
import { CheckCircle2, Hourglass } from 'lucide-react';
import { useCountdown } from '../../hooks/useCountdown.js';

export default function ReleaseCountdown({ releaseAt, completed, onElapsed }) {
  const { label, done } = useCountdown(releaseAt);
  const fired = useRef(false);
  useEffect(() => {
    if (done && !fired.current && !completed) { fired.current = true; const t = setTimeout(() => onElapsed?.(), 2500); return () => clearTimeout(t); }
    return undefined;
  }, [done, completed, onElapsed]);

  if (completed) {
    return <div className="release release-done"><CheckCircle2 size={22} /><div><strong>Slot released</strong><span>Your bay is now available to everyone.</span></div></div>;
  }
  return (
    <div className="release" role="timer">
      <Hourglass size={22} />
      <div>
        <strong>{done ? 'Releasing your slot...' : `Slot becomes available in ${label}`}</strong>
        <span>It stays reserved for you for a short time after payment, then ParkEase releases it automatically.</span>
      </div>
    </div>
  );
}
