import Icon from './Icon';

// Windowed pagination: first, last, current ±1, with ellipses. The old
// version rendered a button for every page, which overflows past ~15 pages.
function windowed(page, total) {
  const set = new Set([1, total, page - 1, page, page + 1]);
  const pages = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  pages.forEach((p, i) => {
    if (i && p - pages[i - 1] > 1) out.push(`gap-${p}`);
    out.push(p);
  });
  return out;
}

export default function Pagination({ page, totalPages, onChange }) {
  if (!totalPages || totalPages < 2) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        <Icon name="chevLeft" />
      </button>
      {windowed(page, totalPages).map((p) =>
        typeof p === 'string'
          ? <span key={p} className="muted" aria-hidden="true">…</span>
          : (
            <button
              key={p}
              type="button"
              className={`btn btn-secondary btn-sm${p === page ? ' is-current' : ''}`}
              onClick={() => onChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ))}
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onChange(page + 1)} disabled={page >= totalPages} aria-label="Next page">
        <Icon name="chevRight" />
      </button>
    </nav>
  );
}
