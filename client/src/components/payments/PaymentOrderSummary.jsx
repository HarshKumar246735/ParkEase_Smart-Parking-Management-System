import { ShieldCheck } from 'lucide-react';
import PlateChip from '../common/PlateChip.jsx';
import { formatDateTime, formatINR, formatMinutes } from '../../utils/format.js';

export default function PaymentOrderSummary({ session: s, mallName }) {
  return (
    <aside className="order card" aria-label="Order summary">
      <div className="order-brand">
        <img src="/logo.svg" alt="" width="32" height="32" />
        <div><strong>ParkEase</strong><span>{mallName}</span></div>
      </div>
      <dl className="detail-list">
        <div><dt>Parking session</dt><dd className="num">{s.sessionNumber}</dd></div>
        <div><dt>Invoice</dt><dd className="num">{s.invoiceNumber}</dd></div>
        <div><dt>Slot</dt><dd>{s.slot?.slotNumber}</dd></div>
        <div><dt>Vehicle</dt><dd><PlateChip number={s.vehicle.registrationNumber} /></dd></div>
        <div><dt>Arrival</dt><dd>{formatDateTime(s.arrivalAt)}</dd></div>
        <div><dt>Departure</dt><dd>{formatDateTime(s.departureAt)}</dd></div>
        <div><dt>Duration</dt><dd>{formatMinutes(s.billableMinutes)}</dd></div>
        <div><dt>Price per minute</dt><dd>{formatINR(s.ratePerMinute)}</dd></div>
        <div><dt>Parking charge</dt><dd>{formatINR(s.parkingCharge)}</dd></div>
        {s.convenienceFee > 0 && <div><dt>Convenience fee</dt><dd>{formatINR(s.convenienceFee)}</dd></div>}
      </dl>
      <div className="order-total"><span>Total payable</span><strong className="num">{formatINR(s.finalAmount)}</strong></div>
      <p className="order-secure"><ShieldCheck size={15} /> Amount fixed by ParkEase when you tapped I&apos;m leaving.</p>
    </aside>
  );
}
