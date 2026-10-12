import { Skeleton } from './Loader.jsx';
import EmptyState from './EmptyState.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/** columns: [{ key, label, render?(row), align?: 'right', strong? }] - collapses to stacked cards on phones. */
export default function DataTable({ columns, rows, loading, rowKey = 'id', empty, onRowClick }) {
  if (loading) {
    return (
      <div className="table-wrap" aria-busy="true">
        <div style={{ padding: 16, display: 'grid', gap: 10 }}>{Array.from({ length: 5 }, (_, i) => <Skeleton key={i} height={38} />)}</div>
      </div>
    );
  }
  if (!rows?.length) {
    return <div className="table-wrap"><EmptyState {...(empty || { title: 'Nothing here yet' })} /></div>;
  }
  return (
    <div className="table-wrap">
      <table className="table stack">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} className={c.align === 'right' ? 'right' : ''}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]} onClick={onRowClick ? () => onRowClick(row) : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
              {columns.map((c) => (
                <td key={c.key} data-label={c.label} className={`${c.align === 'right' ? 'right' : ''} ${c.strong ? 'strong' : ''}`}>
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({ page, pages, total, onPage }) {
  if (!total) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <span>Page {page} of {pages} - {total} result{total === 1 ? '' : 's'}</span>
      <div>
        <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}><ChevronLeft size={16} /> Prev</button>
        <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next <ChevronRight size={16} /></button>
      </div>
    </nav>
  );
}
