export function Spinner({ label = 'Loading' }) {
  return <div className="spinner" role="status" aria-label={label} />;
}
export function FullLoader({ label = 'Loading' }) {
  return (
    <div className="full-loader">
      <Spinner label={label} />
    </div>
  );
}
export function Skeleton({ height = 20, width = '100%', style }) {
  return <div className="skeleton" style={{ height, width, ...style }} aria-hidden="true" />;
}
export function SkeletonCards({ count = 3, height = 120 }) {
  return (
    <div className="skeleton-grid" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))' }} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </div>
  );
}
