import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Info, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal.jsx';
import PlateChip from '../common/PlateChip.jsx';
import FormField from '../common/FormField.jsx';
import { reservationService } from '../../services/reservationService.js';
import { getErrorMessage } from '../../services/api.js';
import { SLOT_TYPE_LABELS, VEHICLE_LABELS, formatINR } from '../../utils/format.js';

export default function BookingModal({ slot, vehicles, rates, defaultVehicleId, onClose, onBooked }) {
  const [vehicleId, setVehicleId] = useState(defaultVehicleId || vehicles[0]?.id || '');
  const [busy, setBusy] = useState(false);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const rate = rates?.rates?.find((r) => r.vehicleType === vehicle?.vehicleType);
  const evMismatch = slot.slotType === 'EV_CHARGING' && vehicle && vehicle.vehicleType !== 'ELECTRIC';
  const busyVehicle = vehicle && vehicle.status !== 'IDLE';

  const confirm = async () => {
    setBusy(true);
    try {
      const { reservation } = await reservationService.create({ vehicleId, slotId: slot.id });
      toast.success(`Slot ${slot.slotNumber} reserved`);
      onBooked(reservation);
    } catch (e) {
      toast.error(getErrorMessage(e));
      setBusy(false);
      onClose(true); // refresh availability - someone else may have taken it
    }
  };

  return (
    <Modal
      title={`Reserve slot ${slot.slotNumber}`}
      onClose={() => onClose(false)}
      locked={busy}
      footer={
        <>
          <button className="btn btn-outline" onClick={() => onClose(false)} disabled={busy}>Cancel</button>
          <button className="btn btn-primary" onClick={confirm} disabled={busy || !vehicle || evMismatch || busyVehicle}>
            {busy ? 'Reserving...' : 'Confirm reservation'}
          </button>
        </>
      }
    >
      <dl className="detail-list">
        <div><dt>Slot</dt><dd>{slot.slotNumber}</dd></div>
        <div><dt>Floor and zone</dt><dd>{slot.floor.name}, {slot.zone.name}</dd></div>
        <div><dt>Slot type</dt><dd>{SLOT_TYPE_LABELS[slot.slotType]}</dd></div>
        <div><dt>Rate</dt><dd>{rate ? `${formatINR(rate.ratePerMinute)} per minute` : 'Choose a vehicle'}</dd></div>
      </dl>

      {vehicles.length === 0 ? (
        <div className="alert alert-warn"><AlertTriangle size={18} /><span>Add a vehicle before reserving. <Link to="/app/vehicles">Add a vehicle</Link></span></div>
      ) : (
        <FormField as="select" label="Vehicle" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
          {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} - {VEHICLE_LABELS[v.vehicleType]}{v.status !== 'IDLE' ? ' (in use)' : ''}</option>)}
        </FormField>
      )}
      {vehicle && <PlateChip number={vehicle.registrationNumber} />}
      {evMismatch && <div className="alert alert-error"><AlertTriangle size={18} /><span>EV charging slots are for Electric Vehicles only. Choose another slot or vehicle.</span></div>}
      {busyVehicle && <div className="alert alert-warn"><AlertTriangle size={18} /><span>This vehicle already has an active reservation or parking session.</span></div>}

      <div className="alert alert-info">
        <Clock size={18} />
        <span>You have <b>{rates?.arrivalWindowMinutes ?? 15} minutes</b> to arrive and tap <b>I have arrived</b>. After that the reservation expires and the slot is released.</span>
      </div>
      <div className="alert alert-info">
        <Info size={18} />
        <span>Charges start at check-in, not at booking. Parking time is rounded up to the next full minute (minimum 1 minute).</span>
      </div>
    </Modal>
  );
}
