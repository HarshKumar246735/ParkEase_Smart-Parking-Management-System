export default function ParkingFloorSelector({ floors, value, onChange }) {
  return (
    <div className="floor-tabs" role="tablist" aria-label="Parking floors">
      {floors.map((f) => (
        <button key={f.id} role="tab" aria-selected={value === f.id} className={`floor-tab ${value === f.id ? 'active' : ''}`} onClick={() => onChange(f.id)}>
          <strong>{f.code}</strong>
          <span>{f.name}</span>
          <em className={f.counts.AVAILABLE ? 'ok' : 'none'}>{f.counts.AVAILABLE} free</em>
        </button>
      ))}
    </div>
  );
}
