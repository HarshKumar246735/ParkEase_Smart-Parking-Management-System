import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="card error-state">
      <div className="empty">
        <div className="empty-icon" style={{ color: '#b42328' }}><AlertTriangle size={26} /></div>
        <h3>We couldn&apos;t load this</h3>
        <p>{message || 'Something went wrong while loading. Check your connection and try again.'}</p>
        {onRetry && <button className="btn btn-outline" onClick={onRetry}><RefreshCw size={16} /> Try again</button>}
      </div>
    </div>
  );
}
