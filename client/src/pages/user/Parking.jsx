import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader.jsx';
import ErrorState from '../../components/common/ErrorState.jsx';
import FormField from '../../components/common/FormField.jsx';
import ParkingFloorSelector from '../../components/parking/ParkingFloorSelector.jsx';
import ParkingZoneSelector from '../../components/parking/ParkingZoneSelector.jsx';
import ParkingSlotGrid from '../../components/parking/ParkingSlotGrid.jsx';
import ParkingLegend from '../../components/parking/ParkingLegend.jsx';
import BookingModal from '../../components/parking/BookingModal.jsx';
import { Skeleton } from '../../components/common/Loader.jsx';
import { parkingService } from '../../services/parkingService.js';
import { vehicleService } from '../../services/vehicleService.js';
import { usePolling } from '../../hooks/usePolling.js';
import { VEHICLE_LABELS } from '../../utils/format.js';
import '../../css/Parking.css';
import '../../css/ParkingSlots.css';

export default function Parking() {
  const navigate = useNavigate();
  const [floorId, setFloorId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [selected, setSelected] = useState(null);

  const vehicles = usePolling(() => vehicleService.list().then((d) => d.vehicles), [], 0);
  const rates = usePolling(() => parkingService.rates(), [], 0);
  const floors = usePolling(() => parkingService.floors().then((d) => d.floors), [], 15000);
  const zones = usePolling(() => (floorId ? parkingService.zones(floorId).then((d) => d.zones) : Promise.resolve([])), [floorId], 15000);

  const vehicleList = vehicles.data || [];
  const vehicle = vehicleList.find((v) => v.id === vehicleId) || vehicleList[0];
  const vehicleType = vehicle?.vehicleType;

  const slots = usePolling(
    () => (floorId ? parkingService.slots({ floorId, ...(zoneId ? { zoneId } : {}), ...(vehicleType ? { vehicleType } : {}) }).then((d) => d.slots) : Promise.resolve([])),
    [floorId, zoneId, vehicleType],
    8000
  );

  useEffect(() => { if (!floorId && floors.data?.length) setFloorId(floors.data[0].id); }, [floors.data, floorId]);
  useEffect(() => { setZoneId(''); }, [floorId]);

  const totals = useMemo(() => {
    const f = floors.data?.find((x) => x.id === floorId);
    return f?.counts;
  }, [floors.data, floorId]);

  const refreshAll = () => { floors.reload(); zones.reload(); slots.reload(); };

  if (floors.error && !floors.data) return <ErrorState message={floors.error} onRetry={floors.reload} />;

  return (
    <>
      <PageHeader
        title="Find parking"
        subtitle="Live availability, refreshed every few seconds. Pick a bay to reserve it for the arrival window."
        actions={<button className="btn btn-outline" onClick={refreshAll}><RefreshCw size={16} /> Refresh</button>}
      />

      <div className="card parking-controls">
        <div className="parking-vehicle">
          {vehicles.loading ? <Skeleton height={44} /> : vehicleList.length ? (
            <FormField as="select" label="Parking with" value={vehicle?.id || ''} onChange={(e) => setVehicleId(e.target.value)} hint="Rates and EV-slot access depend on your vehicle type.">
              {vehicleList.map((v) => <option key={v.id} value={v.id}>{v.registrationNumber} - {VEHICLE_LABELS[v.vehicleType]}</option>)}
            </FormField>
          ) : (
            <p className="muted">You have no vehicles yet. Add one in <a href="/app/vehicles">My vehicles</a> to reserve a bay.</p>
          )}
        </div>
        <ParkingLegend />
      </div>

      {floors.loading && !floors.data ? <Skeleton height={76} /> : <ParkingFloorSelector floors={floors.data || []} value={floorId} onChange={setFloorId} />}

      <div className="card slots-card">
        <div className="slots-head">
          <ParkingZoneSelector zones={zones.data || []} value={zoneId} onChange={setZoneId} />
          {totals && <span className="muted slots-count"><b>{totals.AVAILABLE}</b> of {totals.total} bays free on this floor</span>}
        </div>
        {slots.error && !slots.data ? <ErrorState message={slots.error} onRetry={slots.reload} /> : (
          <ParkingSlotGrid slots={slots.data} loading={slots.loading} selectedId={selected?.id} onSelect={setSelected} />
        )}
      </div>

      {selected && (
        <BookingModal
          slot={selected}
          vehicles={vehicleList}
          rates={rates.data}
          defaultVehicleId={vehicle?.id}
          onClose={(refresh) => { setSelected(null); if (refresh) refreshAll(); }}
          onBooked={(r) => navigate(`/app/reservations/${r.id}`)}
        />
      )}
    </>
  );
}
