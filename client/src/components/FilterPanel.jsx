import { REGIONS, CONDITIONS, TRANSMISSIONS, FUEL_TYPES, BODY_TYPES } from '../utils/options';

const Select = ({ id, label, value, onChange, options, any = 'Any' }) => (
  <div className="field">
    <label className="label-caps" htmlFor={id}>{label}</label>
    <select id={id} className="select" value={value || ''} onChange={onChange} style={{ textTransform: 'capitalize' }}>
      <option value="">{any}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

export default function FilterPanel({ filters, onChange, onClear }) {
  const set = (key) => (e) => onChange({ ...filters, [key]: e.target.value });
  const active = Object.values(filters).filter(Boolean).length;

  return (
    <div className="card card-pad-sm">
      <div className="row between mb-4">
        <span className="card-title">
          Filters {active > 0 && <span className="badge badge-red" style={{ marginLeft: 6 }}>{active}</span>}
        </span>
        <button type="button" onClick={onClear} className="btn btn-ghost btn-sm" disabled={!active}>Clear all</button>
      </div>

      <div className="stack gap-4">
        <div className="field">
          <label className="label-caps" htmlFor="f-make">Make</label>
          <input id="f-make" className="input" value={filters.make || ''} onChange={set('make')} placeholder="e.g. Toyota" />
        </div>
        <div className="field">
          <label className="label-caps" htmlFor="f-model">Model</label>
          <input id="f-model" className="input" value={filters.model || ''} onChange={set('model')} placeholder="e.g. Camry" />
        </div>
        <fieldset className="field" style={{ border: 0 }}>
          <legend className="label-caps" style={{ marginBottom: '.4rem' }}>Year</legend>
          <div className="row gap-2">
            <input type="number" inputMode="numeric" className="input" aria-label="Year from" value={filters.yearMin || ''} onChange={set('yearMin')} placeholder="From" />
            <input type="number" inputMode="numeric" className="input" aria-label="Year to" value={filters.yearMax || ''} onChange={set('yearMax')} placeholder="To" />
          </div>
        </fieldset>
        <fieldset className="field" style={{ border: 0 }}>
          <legend className="label-caps" style={{ marginBottom: '.4rem' }}>Price (GHS)</legend>
          <div className="row gap-2">
            <input type="number" inputMode="numeric" className="input" aria-label="Minimum price" value={filters.minPrice || ''} onChange={set('minPrice')} placeholder="Min" />
            <input type="number" inputMode="numeric" className="input" aria-label="Maximum price" value={filters.maxPrice || ''} onChange={set('maxPrice')} placeholder="Max" />
          </div>
        </fieldset>
        <Select id="f-region" label="Region" value={filters.region} onChange={set('region')} options={REGIONS} any="All regions" />
        <Select id="f-cond" label="Condition" value={filters.condition} onChange={set('condition')} options={CONDITIONS} />
        <Select id="f-trans" label="Transmission" value={filters.transmission} onChange={set('transmission')} options={TRANSMISSIONS} />
        <Select id="f-fuel" label="Fuel type" value={filters.fuelType} onChange={set('fuelType')} options={FUEL_TYPES} />
        <Select id="f-body" label="Body type" value={filters.bodyType} onChange={set('bodyType')} options={BODY_TYPES} />
      </div>
    </div>
  );
}
