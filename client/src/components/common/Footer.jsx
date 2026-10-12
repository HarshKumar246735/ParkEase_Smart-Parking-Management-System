import { Link } from 'react-router-dom';
import { Logo } from './Navbar.jsx';
import '../../css/Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-about">
          <Logo dark />
          <p>ParkEase is a smart mall parking platform: reserve a bay, park, watch your fee tick up honestly, and pay in seconds.</p>
        </div>
        <div>
          <h4>Product</h4>
          <a href="/#features">Features</a>
          <a href="/#how">How it works</a>
          <a href="/#parking">Live availability</a>
        </div>
        <div>
          <h4>Help</h4>
          <a href="/#contact">Contact</a>
          <Link to="/register">Create an account</Link>
          <Link to="/login">Sign in</Link>
        </div>
        <div>
          <h4>Legal</h4>
          <a href="/#privacy">Privacy Policy</a>
          <a href="/#terms">Terms and Conditions</a>
        </div>
      </div>
      <div className="container footer-legal">
        <p id="privacy"><b>Privacy:</b> ParkEase stores only the account, vehicle and parking details needed to run the demo. No real payment details are ever collected or stored.</p>
        <p id="terms"><b>Terms:</b> This is a demonstration service with sample data. Bookings, bills and receipts have no legal or financial value.</p>
        <p className="footer-demo">DEMO PROJECT - ParkEase is a portfolio application. No real money is charged and no real parking space is reserved.</p>
      </div>
    </footer>
  );
}
