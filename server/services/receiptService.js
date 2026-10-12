import Payment from '../models/Payment.js';
import ParkingSession from '../models/ParkingSession.js';
import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import { env } from '../config/env.js';
import { notFound, forbidden, conflict } from '../utils/ApiError.js';
import { getSettings } from './settingsService.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (d) => (d ? new Date(d).toLocaleString('en-IN', { timeZone: env.timezone, dateStyle: 'medium', timeStyle: 'medium' }) : '-');
const inr = (n) => `₹${Number(n ?? 0).toFixed(2)}`;
const METHOD_LABEL = { UPI: 'UPI', CARD: 'Card', NETBANKING: 'Net Banking', WALLET: 'Wallet' };

/** Builds a printable, self-contained HTML receipt from saved payment + session records only. */
export async function buildReceiptHtml(paymentId, requester) {
  const payment = await Payment.findById(paymentId);
  if (!payment) throw notFound('Payment not found');
  if (requester.role !== 'ADMIN' && String(payment.userId) !== String(requester.id)) throw forbidden();
  if (payment.status !== 'SUCCESS') throw conflict('A receipt is only available for successful payments', 'NO_RECEIPT');

  const session = await ParkingSession.findById(payment.sessionId).populate({ path: 'slotId', select: 'slotNumber slotType floorId zoneId', populate: [{ path: 'floorId', select: 'name' }, { path: 'zoneId', select: 'name' }] });
  const [user, vehicle, settings] = await Promise.all([User.findById(payment.userId).lean(), Vehicle.findById(session.vehicleId).lean(), getSettings()]);
  const slot = session.slotId;

  const row = (k, v) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Receipt ${esc(payment.receiptNumber)} - ParkEase</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#eef2f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0e1a33;padding:24px}
.sheet{position:relative;max-width:720px;margin:0 auto;background:#fff;border:1px solid #dbe2ee;border-radius:14px;overflow:hidden}
.head{background:#0b1b3a;color:#fff;padding:24px 32px;display:flex;justify-content:space-between;align-items:center}
.brand{font-size:24px;font-weight:700;letter-spacing:.2px}.brand span{color:#2dd4bf}
.head small{display:block;color:#a9b7d4;margin-top:2px}.badge{border:1px solid #2dd4bf;color:#2dd4bf;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:700}
.body{padding:28px 32px;position:relative}
.wm{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:84px;font-weight:800;color:rgba(11,27,58,.05);transform:rotate(-22deg);pointer-events:none;text-align:center;line-height:1}
h2{margin:0 0 4px;font-size:15px;color:#5b6985;font-weight:600}
table{width:100%;border-collapse:collapse;margin:8px 0 22px;position:relative}
th{text-align:left;font-weight:500;color:#5b6985;padding:8px 0;width:44%;border-bottom:1px solid #edf1f7;font-size:14px}
td{padding:8px 0;border-bottom:1px solid #edf1f7;font-size:14px;font-weight:600;text-align:right}
.total{display:flex;justify-content:space-between;align-items:center;background:#effbf9;border:1px solid #bdeee7;border-radius:12px;padding:16px 20px;position:relative}
.total b{font-size:26px;color:#0a7f74}.status{color:#0a7f74;font-weight:700}
.foot{padding:16px 32px 24px;color:#5b6985;font-size:12px;text-align:center}
.actions{max-width:720px;margin:16px auto 0;text-align:center}.actions button{background:#0b1b3a;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-size:14px;cursor:pointer}
@media print{body{background:#fff;padding:0}.actions{display:none}.sheet{border:0}}
</style></head><body>
<div class="sheet">
  <div class="head"><div><div class="brand">Park<span>Ease</span></div><small>${esc(settings.mallName || env.mallName)}</small></div>
  <div style="text-align:right"><div class="badge">DEMO PAYMENT</div><small>Receipt ${esc(payment.receiptNumber)}</small></div></div>
  <div class="body"><div class="wm">DEMO<br/>PAYMENT</div>
    <h2>Payment</h2>
    <table>
      ${row('Transaction reference', payment.transactionReference)}
      ${row('Invoice number', payment.invoiceNumber)}
      ${row('Payment method', `${METHOD_LABEL[payment.method] || payment.method} - ${payment.provider}`)}
      ${row('Payment status', payment.status)}
      ${row('Paid at', fmtDate(payment.paidAt))}
    </table>
    <h2>Customer &amp; vehicle</h2>
    <table>
      ${row('Name', user?.name)}
      ${row('Vehicle', `${session.registrationNumber} (${vehicle ? `${vehicle.brand} ${vehicle.model}, ${vehicle.color}` : session.vehicleType})`)}
    </table>
    <h2>Parking</h2>
    <table>
      ${row('Session', session.sessionNumber)}
      ${row('Parking slot', `${slot?.slotNumber} - ${slot?.floorId?.name || ''}, ${slot?.zoneId?.name || ''}`)}
      ${row('Arrival', fmtDate(session.arrivalAt))}
      ${row('Departure', fmtDate(session.departureAt))}
      ${row('Billable duration', `${session.billableMinutes} min`)}
      ${row('Rate', `${inr(session.ratePerMinute)} / minute (rounded up to the next minute)`)}
      ${row('Parking fee', inr(session.parkingCharge))}
      ${row('Convenience fee', inr(session.convenienceFee))}
      ${row('Discount', inr(session.discount))}
    </table>
    <div class="total"><span class="status">Payment ${esc(payment.status)}</span><span>Amount paid&nbsp; <b>${inr(payment.amount)}</b></span></div>
  </div>
  <div class="foot">DEMO PAYMENT - No real money was charged. ParkEase is a portfolio project; this receipt has no legal or tax value.</div>
</div>
<div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;
}
