import PlateChip from '../common/PlateChip.jsx';
import { formatDateTime, formatINR, formatMinutes, METHOD_LABELS, placeLabel } from '../../utils/format.js';

export default function ReceiptCard({ payment: p, session: s, userName }) {
  return (
    <div className="receipt">
      <div className="receipt-head">
        <div><strong>ParkEase</strong><span>Receipt {p.receiptNumber}</span></div>
        <span className="badge badge-demo">DEMO PAYMENT</span>
      </div>
      <dl className="detail-list">
        <div><dt>Transaction reference</dt><dd className="num">{p.transactionReference}</dd></div>
        <div><dt>Invoice number</dt><dd className="num">{p.invoiceNumber}</dd></div>
        {userName && <div><dt>Customer</dt><dd>{userName}</dd></div>}
        <div><dt>Vehicle</dt><dd><PlateChip number={s.vehicle.registrationNumber} /></dd></div>
        <div><dt>Parking slot</dt><dd>{s.slot?.slotNumber} - {placeLabel(s.slot)}</dd></div>
        <div><dt>Arrival</dt><dd>{formatDateTime(s.arrivalAt)}</dd></div>
        <div><dt>Departure</dt><dd>{formatDateTime(s.departureAt)}</dd></div>
        <div><dt>Duration</dt><dd>{formatMinutes(s.billableMinutes)}</dd></div>
        <div><dt>Rate</dt><dd>{formatINR(s.ratePerMinute)} / minute</dd></div>
        <div><dt>Payment method</dt><dd>{METHOD_LABELS[p.method]} - {p.provider}</dd></div>
        <div><dt>Paid at</dt><dd>{formatDateTime(p.paidAt)}</dd></div>
      </dl>
      <div className="receipt-total"><span>Amount paid</span><strong className="num">{formatINR(p.amount)}</strong></div>
    </div>
  );
}
