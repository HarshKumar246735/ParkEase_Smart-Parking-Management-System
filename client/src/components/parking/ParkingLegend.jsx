const ITEMS = [
  ['AVAILABLE', 'Available'], ['RESERVED', 'Reserved'], ['OCCUPIED', 'Occupied'], ['RELEASE_PENDING', 'Release pending'], ['MAINTENANCE', 'Maintenance'],
];
export default function ParkingLegend() {
  return (
    <ul className="legend" aria-label="Slot colour legend">
      {ITEMS.map(([s, label]) => (
        <li key={s}><span className={`legend-swatch swatch-${s}`} aria-hidden="true" />{label}</li>
      ))}
    </ul>
  );
}
