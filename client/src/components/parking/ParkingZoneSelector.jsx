export default function ParkingZoneSelector({ zones, value, onChange }) {
  return (
    <div className="zone-pills" role="group" aria-label="Zones">
      <button className={`pill ${!value ? 'active' : ''}`} onClick={() => onChange('')}>All zones</button>
      {zones.map((z) => (
        <button key={z.id} className={`pill ${value === z.id ? 'active' : ''}`} onClick={() => onChange(z.id)}>
          {z.name} <small>{z.counts.AVAILABLE}/{z.counts.total}</small>
        </button>
      ))}
    </div>
  );
}
