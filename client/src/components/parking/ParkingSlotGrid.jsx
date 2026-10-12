import ParkingSlotCard from './ParkingSlotCard.jsx';
import { Skeleton } from '../common/Loader.jsx';
import EmptyState from '../common/EmptyState.jsx';
import { ParkingSquare } from 'lucide-react';

export default function ParkingSlotGrid({ slots, loading, onSelect, selectedId }) {
  if (loading && !slots) {
    return <div className="slot-grid">{Array.from({ length: 12 }, (_, i) => <Skeleton key={i} height={104} />)}</div>;
  }
  if (!slots?.length) {
    return <EmptyState icon={ParkingSquare} title="No slots to show" message="There are no slots matching this floor and zone yet." />;
  }
  const groups = [];
  slots.forEach((s) => {
    let g = groups.find((x) => x.id === s.zone.id);
    if (!g) { g = { id: s.zone.id, name: s.zone.name, slots: [] }; groups.push(g); }
    g.slots.push(s);
  });
  return (
    <div className="zone-groups">
      {groups.map((g) => (
        <section key={g.id} aria-label={g.name}>
          {groups.length > 1 && <h3 className="zone-title">{g.name}</h3>}
          <div className="slot-grid">
            {g.slots.map((s) => <ParkingSlotCard key={s.id} slot={s} onSelect={onSelect} selected={selectedId === s.id} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
