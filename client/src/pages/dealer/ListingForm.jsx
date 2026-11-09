import { useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Icon from '../../components/Icon';
import { Field } from '../../components/Form';
import { REGIONS, BODY_TYPES, CONDITIONS, TRANSMISSIONS, FUEL_TYPES } from '../../utils/options';

const MAX_IMAGES = 10;
const OK_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const schema = yup.object({
  title: yup.string().required('Give the listing a title'),
  make: yup.string().required('Enter the make'),
  model: yup.string().required('Enter the model'),
  year: yup.number().typeError('Enter a year, e.g. 2020').min(1960, 'Year must be 1960 or later').max(new Date().getFullYear() + 1, 'That year is in the future').required('Enter the year'),
  condition: yup.string().required('Choose a condition'),
  bodyType: yup.string().required('Choose a body type'),
  transmission: yup.string().required('Choose a transmission'),
  fuelType: yup.string().required('Choose a fuel type'),
  mileage: yup.number().typeError('Mileage must be a number').min(0).nullable().transform((v) => (Number.isNaN(v) ? null : v)),
  mileageUnit: yup.string(),
  color: yup.string(),
  price: yup.number().typeError('Enter a price').min(1, 'Price must be above zero').required('Enter a price'),
  currency: yup.string(),
  region: yup.string().required('Choose a region'),
  location: yup.string(),
  description: yup.string().max(2000),
});

const Section = ({ n, title, hint, children }) => (
  <section className="card card-pad mb-4">
    <div className="row gap-3 mb-4">
      <span className="avatar" style={{ width: 26, height: 26, fontSize: '.75rem' }}>{n}</span>
      <div>
        <h2 className="card-title">{title}</h2>
        {hint && <p className="text-xs muted">{hint}</p>}
      </div>
    </div>
    <div className="stack gap-4">{children}</div>
  </section>
);

const Options = ({ list, placeholder = 'Select' }) => (
  <>
    <option value="" disabled>{placeholder}</option>
    {list.map((o) => <option key={o} value={o}>{o}</option>)}
  </>
);

export default function ListingForm({ defaultValues = {}, existingImages = [], onSubmit, submitLabel, loading }) {
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [keptImgs, setKeptImgs] = useState(existingImages);
  const [dragging, setDragging] = useState(false);
  const [descLen, setDescLen] = useState(defaultValues.description?.length || 0);
  const [imgError, setImgError] = useState('');
  const fileRef = useRef(null);
  const imagesRef = useRef(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      currency: 'GHS', mileageUnit: 'km', condition: '', bodyType: '',
      transmission: '', fuelType: '', region: '', ...defaultValues,
    },
  });

  const count = keptImgs.length + newFiles.length;

  const addFiles = useCallback((files) => {
    const all = Array.from(files);
    const valid = all.filter((f) => OK_TYPES.includes(f.type));
    const room = MAX_IMAGES - keptImgs.length - newFiles.length;
    const allowed = valid.slice(0, Math.max(room, 0));
    const notes = [];
    if (valid.length < all.length) notes.push('Some files were skipped: only JPEG, PNG and WebP are accepted.');
    if (valid.length > allowed.length) notes.push(`You can add up to ${MAX_IMAGES} photos; only the first ${allowed.length} were added.`);
    setImgError(notes.join(' '));
    setNewFiles((prev) => [...prev, ...allowed]);
    allowed.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target.result]);
      reader.readAsDataURL(f);
    });
  }, [keptImgs.length, newFiles.length]);

  const removeNew = (i) => {
    setNewFiles((p) => p.filter((_, j) => j !== i));
    setPreviews((p) => p.filter((_, j) => j !== i));
  };
  const removeExisting = (url) => setKeptImgs((p) => p.filter((u) => u !== url));

  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const handleFormSubmit = (data) => {
    if (count === 0) {
      setImgError('Add at least one photo of the car.');
      imagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
    newFiles.forEach((f) => fd.append('images', f));
    // One JSON array, not repeated fields, so the server can tell "kept nothing"
    // apart from "field not sent" (repeated fields vanish when the array is empty).
    fd.append('keptImages', JSON.stringify(keptImgs));
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Section n="1" title="Photos" hint={`Up to ${MAX_IMAGES}. The first photo is the cover image.`}>
        <div ref={imagesRef} className="stack gap-3">
          {count > 0 && (
            <div className="img-grid">
              {keptImgs.map((url, i) => (
                <div key={url} className="img-tile">
                  <img src={url} alt={`Saved upload ${i + 1}`} />
                  {i === 0 && <span className="badge badge-solid" style={{ position: 'absolute', left: 4, bottom: 4 }}>Cover</span>}
                  <button type="button" className="rm" onClick={() => removeExisting(url)} aria-label={`Remove current photo ${i + 1}`}><Icon name="x" /></button>
                </div>
              ))}
              {previews.map((src, i) => (
                <div key={src.slice(-24) + i} className="img-tile">
                  <img src={src} alt={`New upload ${i + 1}`} />
                  {keptImgs.length === 0 && i === 0 && <span className="badge badge-solid" style={{ position: 'absolute', left: 4, bottom: 4 }}>Cover</span>}
                  <button type="button" className="rm" onClick={() => removeNew(i)} aria-label={`Remove new photo ${i + 1}`}><Icon name="x" /></button>
                </div>
              ))}
            </div>
          )}

          {count < MAX_IMAGES && (
            <label
              className="dropzone"
              style={dragging ? { borderColor: 'var(--red-text)', background: 'var(--red-soft)' } : undefined}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <Icon name="upload" />
              <span><strong className="red">Choose photos</strong> or drag them here</span>
              <span className="text-xs">JPEG, PNG or WebP · up to 5 MB each</span>
              <input ref={fileRef} type="file" accept={OK_TYPES.join(',')} multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            </label>
          )}

          <div className="row between">
            <span className="text-xs muted" aria-live="polite">{count} of {MAX_IMAGES} photos</span>
          </div>
          {imgError && <div className="field-error" role="alert"><Icon name="alert" size={14} />{imgError}</div>}
        </div>
      </Section>

      <Section n="2" title="The basics">
        <Field label="Listing title" placeholder="e.g. 2020 Toyota Camry SE" error={errors.title?.message} {...register('title')} />
        <div className="grid-2">
          <Field label="Make" placeholder="Toyota" error={errors.make?.message} {...register('make')} />
          <Field label="Model" placeholder="Camry" error={errors.model?.message} {...register('model')} />
        </div>
        <div className="grid-3">
          <Field label="Year" type="number" inputMode="numeric" placeholder="2020" error={errors.year?.message} {...register('year')} />
          <Field as="select" label="Condition" error={errors.condition?.message} style={{ textTransform: 'capitalize' }} {...register('condition')}><Options list={CONDITIONS} /></Field>
          <Field as="select" label="Body type" error={errors.bodyType?.message} style={{ textTransform: 'capitalize' }} {...register('bodyType')}><Options list={BODY_TYPES} /></Field>
        </div>
      </Section>

      <Section n="3" title="Specifications">
        <div className="grid-2">
          <Field as="select" label="Transmission" error={errors.transmission?.message} style={{ textTransform: 'capitalize' }} {...register('transmission')}><Options list={TRANSMISSIONS} /></Field>
          <Field as="select" label="Fuel type" error={errors.fuelType?.message} style={{ textTransform: 'capitalize' }} {...register('fuelType')}><Options list={FUEL_TYPES} /></Field>
        </div>
        <div className="grid-3">
          <Field label="Mileage" type="number" inputMode="numeric" placeholder="45000" error={errors.mileage?.message} {...register('mileage')} />
          <Field as="select" label="Unit" {...register('mileageUnit')}>
            <option value="km">km</option>
            <option value="miles">miles</option>
          </Field>
          <Field label="Colour" placeholder="Pearl white" {...register('color')} />
        </div>
      </Section>

      <Section n="4" title="Price and location">
        <div className="grid-2">
          <Field label="Price" type="number" inputMode="numeric" placeholder="85000" error={errors.price?.message} {...register('price')} />
          <Field as="select" label="Currency" {...register('currency')}>
            <option value="GHS">GHS (cedis)</option>
            <option value="USD">USD (dollars)</option>
          </Field>
        </div>
        <div className="grid-2">
          <Field as="select" label="Region" error={errors.region?.message} {...register('region')}><Options list={REGIONS} placeholder="Choose a region" /></Field>
          <Field label="Area (optional)" placeholder="Spintex Road, Accra" {...register('location')} />
        </div>
      </Section>

      <Section n="5" title="Description" hint="Condition, service history, extras, and anything a buyer should know.">
        <div className="field">
          <label className="sr-only" htmlFor="lf-desc">Description</label>
          <textarea
            id="lf-desc"
            className="textarea"
            rows={6}
            maxLength={2000}
            placeholder="One owner, full service history, new tyres…"
            {...register('description', { onChange: (e) => setDescLen(e.target.value.length) })}
          />
          <span className="hint" style={{ alignSelf: 'flex-end', color: descLen > 1800 ? 'var(--color-warning)' : undefined }}>{descLen} / 2000</span>
        </div>
      </Section>

      <div className="card card-pad-sm row between wrap gap-3" style={{ position: 'sticky', bottom: 12, zIndex: 5, boxShadow: 'var(--shadow-lg)' }}>
        <span className="text-sm muted">{Object.keys(errors).length > 0 ? <span style={{ color: '#ff7b7b' }}>Fix the highlighted fields above.</span> : 'Check the details, then submit.'}</span>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? <><span className="spinner" /> Saving…</> : submitLabel}
        </button>
      </div>
    </form>
  );
}
