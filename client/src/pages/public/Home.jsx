import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Radar, CalendarCheck, Clock, Gauge, CreditCard, Unlock, Receipt, BarChart3, Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import Navbar from '../../components/common/Navbar.jsx';
import Footer from '../../components/common/Footer.jsx';
import { parkingService } from '../../services/parkingService.js';
import { usePolling } from '../../hooks/usePolling.js';
import { formatINR, VEHICLE_LABELS } from '../../utils/format.js';
import '../../css/Home.css';

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (target == null) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return undefined; }
    let raf; const start = performance.now(); const from = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(from + (target - from) * (1 - (1 - p) ** 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Stat({ label, value }) {
  const n = useCountUp(value);
  return <div className="hstat"><strong className="num">{value == null ? '-' : n}</strong><span>{label}</span></div>;
}

const STEPS = [
  ['Choose a parking slot', 'Pick your floor and zone, see every bay in real time, and reserve the one you like.'],
  ['Arrive within the window', 'You have a short arrival window. Tap I have arrived at the mall to start your session.'],
  ['Park and track your charges', 'A live timer shows time and charge. Billing is rounded up to the next minute, so there are no surprises.'],
  ['Pay and leave', 'Tap I\'m leaving, review the fixed bill, pay with a demo method and download your receipt.'],
];

const FEATURES = [
  [Radar, 'Real-time availability', 'Bay colours update straight from the parking database.'],
  [CalendarCheck, 'Instant reservations', 'Two drivers can never hold the same bay.'],
  [Clock, 'Arrival window', 'Arrive in time or the bay returns to the pool automatically.'],
  [Gauge, 'Live fee calculation', 'Time and charge tick up while you park, from the server clock.'],
  [CreditCard, 'Easy demo payments', 'UPI, card, net banking and wallet, all simulated.'],
  [Unlock, 'Automatic slot release', 'After payment the bay frees itself, even if you close the app.'],
  [Receipt, 'Digital receipts', 'Download a receipt built from your saved payment record.'],
  [BarChart3, 'Admin analytics', 'Occupancy, revenue and sessions for operators.'],
];

export default function Home() {
  const availability = usePolling(() => parkingService.availability(), [], 15000);
  const slots = usePolling(() => parkingService.slots({ limit: 28 }).then((d) => d.slots), [], 15000);
  const rates = usePolling(() => parkingService.rates(), [], 0);
  const a = availability.data;
  const car = rates.data?.rates?.find((r) => r.vehicleType === 'CAR');

  return (
    <div className="home">
      <Navbar />
      <section className="hero" id="home">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>Smart Parking. Seamless Arrival.</h1>
            <p>Find your parking space, reserve it in advance, and enjoy a smoother mall visit with ParkEase.</p>
            <div className="hero-cta">
              <Link to="/register" className="btn btn-teal btn-lg">Get started free</Link>
              <a href="#parking" className="btn btn-lg hero-ghost">See live availability</a>
            </div>
            <p className="hero-demo">Demo project. No real payments, no real parking.</p>
            <div className="hstats" aria-live="polite">
              <Stat label="Total slots" value={a?.total ?? null} />
              <Stat label="Available now" value={a?.available ?? null} />
              <Stat label="Occupied" value={a?.occupied ?? null} />
              <Stat label="Active sessions" value={a?.activeSessions ?? null} />
            </div>
            {availability.error && !a && <p className="hero-err">Live statistics are unavailable right now.</p>}
          </div>

          <div className="board" aria-label="Live parking bays">
            <div className="board-head"><span className="board-dot" /> Live bay board <small>from the parking database</small></div>
            {slots.data?.length ? (
              <div className="board-grid">
                {slots.data.map((s) => <span key={s.id} className={`bay bay-${s.status}`} title={`${s.slotNumber} - ${s.status.replace('_', ' ').toLowerCase()}`}><i>{s.slotNumber.split('-').pop()}</i></span>)}
              </div>
            ) : slots.error ? <p className="board-empty">Could not load bays. Is the API running?</p> : <div className="board-grid">{Array.from({ length: 28 }, (_, i) => <span key={i} className="bay bay-skel" />)}</div>}
            <ul className="board-legend">
              <li><span className="bay-AVAILABLE" />Available</li><li><span className="bay-RESERVED" />Reserved</li><li><span className="bay-OCCUPIED" />Occupied</li><li><span className="bay-RELEASE_PENDING" />Releasing</li><li><span className="bay-MAINTENANCE" />Maintenance</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="container">
          <div className="section-head"><h2>How it works</h2><p>Four steps from your couch to your bay.</p></div>
          <ol className="steps">
            {STEPS.map(([t, d], i) => (
              <li key={t}><span className="step-no">{i + 1}</span><h3>{t}</h3><p>{d}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-alt" id="features">
        <div className="container">
          <div className="section-head"><h2>Built for a calmer mall visit</h2><p>Everything the driver and the operator need, backed by a real API and database.</p></div>
          <div className="features">
            {FEATURES.map(([Icon, t, d]) => (
              <div className="feature" key={t}><Icon size={22} aria-hidden="true" /><h3>{t}</h3><p>{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="parking">
        <div className="container parking-grid">
          <div>
            <div className="section-head left"><h2>Parking, floor by floor</h2><p>Live counts from the database. Create an account to reserve a bay.</p></div>
            {a?.byFloor?.length ? (
              <ul className="floors">
                {a.byFloor.map((f) => {
                  const used = f.total - f.AVAILABLE;
                  return (
                    <li key={f.id}>
                      <div className="floor-row"><strong>{f.name}</strong><span className="num">{f.AVAILABLE} free of {f.total}</span></div>
                      <div className="floor-bar" aria-hidden="true"><span style={{ width: `${f.total ? (used / f.total) * 100 : 0}%` }} /></div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="muted">{availability.error ? 'Availability is unavailable right now.' : 'Loading availability...'}</p>}
            <Link to="/register" className="btn btn-primary" style={{ marginTop: 24 }}>Reserve a bay <ArrowRight size={16} /></Link>
          </div>
          <div className="pricing">
            <p className="pricing-kicker">Simple pricing</p>
            <p className="pricing-rate num">{car ? formatINR(car.ratePerMinute) : '-'}<span> per minute</span></p>
            <p className="pricing-note">Parking time is rounded up to the next full minute, with a one-minute minimum. 45 minutes at {car ? formatINR(car.ratePerMinute) : '-'}/min is {car ? formatINR(car.ratePerMinute * 45) : '-'}.</p>
            <ul className="rate-list">
              {rates.data?.rates?.map((r) => <li key={r.vehicleType}><span>{VEHICLE_LABELS[r.vehicleType]}</span><b className="num">{formatINR(r.ratePerMinute)}/min</b></li>)}
            </ul>
            <p className="pricing-fine">Arrive within {rates.data?.arrivalWindowMinutes ?? 15} minutes of booking. Your bay is released {rates.data?.releaseDelayMinutes ?? 2} minutes after payment.</p>
          </div>
        </div>
      </section>

      <section className="section section-alt" id="contact">
        <div className="container contact">
          <div className="section-head left"><h2>Contact</h2><p>Questions about this demo? Reach out.</p></div>
          <ul className="contact-list">
            <li><Mail size={18} /> <a href="mailto:support@parkease.example">support@parkease.example</a></li>
            <li><Phone size={18} /> +91 00000 00000</li>
            <li><MapPin size={18} /> ParkEase Mall (demo location)</li>
          </ul>
        </div>
      </section>
      <Footer />
    </div>
  );
}
