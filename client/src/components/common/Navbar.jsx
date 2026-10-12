import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth.js';
import '../../css/Navbar.css';

const LINKS = [
  { href: '/#home', label: 'Home' },
  { href: '/#how', label: 'How it works' },
  { href: '/#features', label: 'Features' },
  { href: '/#parking', label: 'Parking' },
  { href: '/#contact', label: 'Contact' },
];

export function Logo({ dark = false }) {
  return (
    <Link to="/" className={`logo ${dark ? 'logo-dark' : ''}`} aria-label="ParkEase home">
      <img src="/logo.svg" alt="" width="34" height="34" />
      <span>Park<b>Ease</b></span>
    </Link>
  );
}

export default function Navbar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const dash = user?.role === 'ADMIN' ? '/admin' : '/app';
  return (
    <header className={`navbar ${scrolled || open ? 'navbar-solid' : ''}`}>
      <div className="container navbar-inner">
        <Logo />
        <nav className={`nav-links ${open ? 'open' : ''}`} aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
          ))}
          <div className="nav-cta-mobile">
            {user ? (
              <Link className="btn btn-teal btn-block" to={dash}>Go to dashboard</Link>
            ) : (
              <>
                <Link className="btn btn-outline btn-block" to="/login">Login</Link>
                <Link className="btn btn-teal btn-block" to="/register">Get started</Link>
              </>
            )}
          </div>
        </nav>
        <div className="nav-cta">
          {user ? (
            <Link className="btn btn-teal btn-sm" to={dash}>Dashboard</Link>
          ) : (
            <>
              <Link className="nav-login" to="/login">Login</Link>
              <Link className="btn btn-teal btn-sm" to="/register">Get started</Link>
            </>
          )}
        </div>
        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={open ? 'Close menu' : 'Open menu'}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
