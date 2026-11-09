import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CarCard, { CarCardSkeleton } from '../components/CarCard';
import FilterPanel from '../components/FilterPanel';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';
import axiosInstance from '../api/axiosInstance';

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest first' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'views_desc', label: 'Most viewed' },
];
const FILTER_KEYS = ['make', 'model', 'region', 'bodyType', 'condition', 'transmission', 'fuelType', 'minPrice', 'maxPrice', 'yearMin', 'yearMax'];
const EMPTY = Object.fromEntries(FILTER_KEYS.map((k) => [k, '']));
const LIMIT = 20;

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('createdAt_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(() =>
    Object.fromEntries(FILTER_KEYS.map((k) => [k, searchParams.get(k) || ''])));

  const totalPages = Math.ceil(total / LIMIT);
  const activeCount = Object.values(filters).filter(Boolean).length;

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
      const [sortField, sortDir] = sort.split('_');
      params.set('sortField', sortField);
      params.set('sortDir', sortDir);
      const { data } = await axiosInstance.get(`/listings?${params}`);
      setListings(data.listings);
      setTotal(data.total);
    } catch {
      setListings([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, sort]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const handleFilters = (next) => {
    setFilters(next);
    setPage(1);
    const p = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => { if (v) p.set(k, v); });
    setSearchParams(p, { replace: true });
  };

  const goToPage = (p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="page">
      <Navbar />
      <main id="main" className="page-main container section-sm">
        <div className="page-header">
          <div>
            <h1>Browse cars</h1>
            <p aria-live="polite">
              {loading ? 'Searching…' : `${total.toLocaleString()} ${total === 1 ? 'car' : 'cars'} found`}
            </p>
          </div>
          <div className="row gap-2">
            <button
              type="button"
              className="btn btn-secondary filter-toggle"
              onClick={() => setShowFilters((p) => !p)}
              aria-expanded={showFilters}
              aria-controls="filters"
            >
              <Icon name="filter" /> Filters {activeCount > 0 && <span className="badge badge-red">{activeCount}</span>}
            </button>
            <label className="sr-only" htmlFor="sort">Sort by</label>
            <select id="sort" className="select" style={{ width: 'auto', minWidth: 190 }} value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        <div className="split-filters">
          <aside id="filters" className={`filters-col${showFilters ? ' is-open' : ''}`} aria-label="Filters">
            <FilterPanel filters={filters} onChange={handleFilters} onClear={() => handleFilters(EMPTY)} />
          </aside>

          <div>
            <div className="grid-cards">
              {loading
                ? Array.from({ length: 8 }, (_, i) => <CarCardSkeleton key={i} />)
                : listings.length === 0
                  ? (
                    <div className="card empty" style={{ gridColumn: '1 / -1' }}>
                      <Icon name="search" />
                      <h3>No cars match these filters</h3>
                      <p>Try widening the price or year range, or clear the filters to see everything.</p>
                      {activeCount > 0 && <button type="button" className="btn btn-secondary" onClick={() => handleFilters(EMPTY)}>Clear filters</button>}
                    </div>
                  )
                  : listings.map((l) => <CarCard key={l._id} listing={l} />)}
            </div>
            {!loading && <Pagination page={page} totalPages={totalPages} onChange={goToPage} />}
          </div>
        </div>
      </main>
      <Footer />
      <style>{`
        .filter-toggle { display: none; }
        @media (max-width: 900px) {
          .filter-toggle { display: inline-flex; }
          .filters-col { display: none; }
          .filters-col.is-open { display: block; }
        }
      `}</style>
    </div>
  );
}
