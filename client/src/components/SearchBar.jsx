import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { REGIONS, BODY_TYPES, CONDITIONS } from '../utils/options';

export default function SearchBar({ initialValues = {} }) {
  const [make, setMake] = useState(initialValues.make || '');
  const [region, setRegion] = useState(initialValues.region || '');
  const [bodyType, setBodyType] = useState(initialValues.bodyType || '');
  const [condition, setCondition] = useState(initialValues.condition || '');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set('make', make);
    if (region) params.set('region', region);
    if (bodyType) params.set('bodyType', bodyType);
    if (condition) params.set('condition', condition);
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <form className="searchbar" onSubmit={handleSearch} role="search" aria-label="Search cars">
      <div className="input-icon">
        <Icon name="search" />
        <label className="sr-only" htmlFor="sb-make">Make</label>
        <input id="sb-make" className="input" value={make} onChange={(e) => setMake(e.target.value)} placeholder="Make, e.g. Toyota" />
      </div>
      <label className="sr-only" htmlFor="sb-region">Region</label>
      <select id="sb-region" className="select" value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value="">All regions</option>
        {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <label className="sr-only" htmlFor="sb-body">Body type</label>
      <select id="sb-body" className="select" value={bodyType} onChange={(e) => setBodyType(e.target.value)} style={{ textTransform: 'capitalize' }}>
        <option value="">Any body type</option>
        {BODY_TYPES.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <label className="sr-only" htmlFor="sb-cond">Condition</label>
      <select id="sb-cond" className="select" value={condition} onChange={(e) => setCondition(e.target.value)} style={{ textTransform: 'capitalize' }}>
        <option value="">Any condition</option>
        {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <button type="submit" className="btn btn-primary">
        <Icon name="search" /> Search
      </button>
    </form>
  );
}
