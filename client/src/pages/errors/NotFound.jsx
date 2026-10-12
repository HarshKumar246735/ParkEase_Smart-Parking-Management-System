import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import '../../css/Errors.css';

export default function NotFound() {
  return (
    <div className="err-page">
      <div className="err-card">
        <div className="err-icon"><Compass size={30} /></div>
        <h1>Page not found</h1>
        <p>We could not find the page you were looking for. It may have moved, or the link may be mistyped.</p>
        <Link className="btn btn-primary" to="/">Back to home</Link>
      </div>
    </div>
  );
}
