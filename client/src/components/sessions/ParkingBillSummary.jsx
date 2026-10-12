import PlateChip from '../common/PlateChip.jsx';
import { formatDateTime, formatINR, formatMinutes, placeLabel } from '../../utils/format.js';

export default function ParkingBillSummary({ session: s }) {
  return (
    <div className="bill">
      <div className="bill-head">
        <div><span className="bill-kicker">Invoice</span><strong className="num">{s.invoiceNumber}</strong></div>
        <PlateChip number={s.vehicle.registrationNumber} />
      </div>
      <dl className="detail-list">
        <div><dt>Parking session</dt><dd className="num">{s.sessionNumber}</dd></div>
        <div><dt>Parking slot</dt><dd>{s.slot?.slotNumber} - {placeLabel(s.slot)}</dd></div>
        <div><dt>Arrival</dt><dd>{formatDateTime(s.arrivalAt)}</dd></div>
        <div><dt>Departure</dt><dd>{formatDateTime(s.departureAt)}</dd></div>
        <div><dt>Billable duration</dt><dd>{formatMinutes(s.billableMinutes)} <span className="muted">({s.billableMinutes} min)</span></dd></div>
        <div><dt>Price per minute</dt><dd>{formatINR(s.ratePerMinute)}</dd></div>
        <div><dt>Parking fee</dt><dd>{formatINR(s.parkingCharge)}</dd></div>
        <div><dt>Convenience fee</dt><dd>{formatINR(s.convenienceFee)}</dd></div>
        <div><dt>Discount</dt><dd>{formatINR(s.discount)}</dd></div>
      </dl>
      <div className="bill-total"><span>Total payable</span><strong className="num">{formatINR(s.finalAmount)}</strong></div>
      <p className="bill-note">Time is rounded up to the next full minute (minimum 1 minute). This amount is final and will not increase while you pay.</p>
    </div>
  );
}
