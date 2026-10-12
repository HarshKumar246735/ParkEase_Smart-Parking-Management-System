export default function PlateChip({ number, large = false }) {
  return (
    <span className={`plate ${large ? 'plate-lg' : ''}`} aria-label={`Registration ${number}`}>
      <i>IND</i>
      <span>{number}</span>
    </span>
  );
}
