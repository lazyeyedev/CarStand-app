import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const GHANA_REGIONS   = ['Greater Accra','Ashanti','Western','Eastern','Central','Northern','Upper East','Upper West','Volta','Bono','Bono East','Ahafo','Savannah','North East','Oti','Western North'];
const BODY_TYPES      = ['sedan','suv','pickup','hatchback','coupe','van','bus','convertible','truck'];
const CONDITIONS      = ['new','foreign used','locally used'];
const TRANSMISSIONS   = ['automatic','manual'];
const FUEL_TYPES      = ['petrol','diesel','electric','hybrid'];

const schema = yup.object({
  title:        yup.string().required('Title is required'),
  make:         yup.string().required('Make is required'),
  model:        yup.string().required('Model is required'),
  year:         yup.number().typeError('Year must be a number').min(1960).max(new Date().getFullYear()+1).required('Year is required'),
  condition:    yup.string().required('Condition is required'),
  bodyType:     yup.string().required('Body type is required'),
  transmission: yup.string().required('Transmission is required'),
  fuelType:     yup.string().required('Fuel type is required'),
  mileage:      yup.number().typeError('Must be a number').min(0).nullable().transform(v=>isNaN(v)?null:v),
  mileageUnit:  yup.string(),
  color:        yup.string(),
  price:        yup.number().typeError('Price must be a number').min(1).required('Price is required'),
  currency:     yup.string(),
  region:       yup.string().required('Region is required'),
  location:     yup.string(),
  description:  yup.string().max(2000),
});

const label  = { display:'block', color:'#888', fontSize:'0.78rem', marginBottom:5, fontWeight:600, textTransform:'uppercase', letterSpacing:0.5 };
const inp    = { width:'100%', background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:6, padding:'0.65rem 0.9rem', color:'#ececec', fontSize:'0.88rem', outline:'none', boxSizing:'border-box' };
const sel    = { ...inp, cursor:'pointer' };
const errMsg = { color:'#e05252', fontSize:'0.75rem', marginTop:4 };
const sect   = { background:'#141414', border:'1px solid #2a2a2a', borderRadius:10, padding:'1.25rem', marginBottom:'1.25rem' };
const sectH  = { color:'#c41e2a', fontSize:'0.75rem', fontWeight:700, letterSpacing:1, textTransform:'uppercase', marginBottom:'1rem', paddingBottom:'0.5rem', borderBottom:'1px solid #1e1e1e' };
const row2   = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' };

export default function ListingForm({ defaultValues = {}, existingImages = [], onSubmit, submitLabel, loading }) {
  const [newFiles,  setNewFiles]  = useState([]);
  const [previews,  setPreviews]  = useState([]);
  const [keptImgs,  setKeptImgs]  = useState(existingImages);
  const [dragging,  setDragging]  = useState(false);
  const [descLen,   setDescLen]   = useState(defaultValues.description?.length || 0);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      currency: 'GHS', mileageUnit: 'km', condition: '', bodyType: '',
      transmission: '', fuelType: '', region: '', ...defaultValues
    },
  });

  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter(f => ['image/jpeg','image/png','image/webp'].includes(f.type));
    const total = keptImgs.length + newFiles.length + valid.length;
    const allowed = valid.slice(0, 10 - keptImgs.length - newFiles.length);
    if (total > 10) alert(`Max 10 images. Adding first ${allowed.length}.`);
    setNewFiles(prev => [...prev, ...allowed]);
    allowed.forEach(f => {
      const reader = new FileReader();
      reader.onload = e => setPreviews(prev => [...prev, e.target.result]);
      reader.readAsDataURL(f);
    });
  }, [keptImgs.length, newFiles.length]);

  const removeNew     = (i) => { setNewFiles(p=>{const n=[...p];n.splice(i,1);return n;}); setPreviews(p=>{const n=[...p];n.splice(i,1);return n;}); };
  const removeExisting = (url) => setKeptImgs(p => p.filter(u => u !== url));

  const onDrop = (e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); };

  const handleFormSubmit = (data) => {
    if (keptImgs.length + newFiles.length === 0) {
      alert('At least one image is required.');
      return;
    }
    const fd = new FormData();
    Object.entries(data).forEach(([k,v]) => { if (v !== null && v !== undefined) fd.append(k, v); });
    newFiles.forEach(f => fd.append('images', f));
    // Sent as a single JSON array (not repeated fields) so the server can
    // always tell "kept nothing" apart from "field not sent" — repeated
    // fields disappear entirely when the array is empty, which made
    // removing every existing photo indistinguishable from not touching
    // images at all.
    fd.append('keptImages', JSON.stringify(keptImgs));
    onSubmit(fd);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <style>{`input:focus,select:focus,textarea:focus{border-color:#c41e2a!important;box-shadow:0 0 0 2px rgba(196,30,42,0.12)} select option{background:#1a1a1a;color:#ececec}`}</style>

      {/* Section 1 — Basic Info */}
      <div style={sect}>
        <div style={sectH}>Basic Information</div>
        <div style={{ marginBottom:'1rem' }}>
          <label style={label}>Listing Title</label>
          <input {...register('title')} placeholder="e.g. 2020 Toyota Camry SE" style={inp} />
          {errors.title && <div style={errMsg}>{errors.title.message}</div>}
        </div>
        <div style={{ ...row2, marginBottom:'1rem' }}>
          <div>
            <label style={label}>Make</label>
            <input {...register('make')} placeholder="Toyota" style={inp} />
            {errors.make && <div style={errMsg}>{errors.make.message}</div>}
          </div>
          <div>
            <label style={label}>Model</label>
            <input {...register('model')} placeholder="Camry" style={inp} />
            {errors.model && <div style={errMsg}>{errors.model.message}</div>}
          </div>
        </div>
        <div style={row2}>
          <div>
            <label style={label}>Year</label>
            <input {...register('year')} type="number" placeholder="2020" style={inp} />
            {errors.year && <div style={errMsg}>{errors.year.message}</div>}
          </div>
          <div>
            <label style={label}>Condition</label>
            <select {...register('condition')} style={sel}>
              <option value="">Select</option>
              {CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
            {errors.condition && <div style={errMsg}>{errors.condition.message}</div>}
          </div>
        </div>
        <div style={{ marginTop:'1rem' }}>
          <label style={label}>Body Type</label>
          <select {...register('bodyType')} style={{ ...sel, textTransform:'capitalize' }}>
            <option value="">Select</option>
            {BODY_TYPES.map(b=><option key={b} value={b} style={{textTransform:'capitalize'}}>{b}</option>)}
          </select>
          {errors.bodyType && <div style={errMsg}>{errors.bodyType.message}</div>}
        </div>
      </div>

      {/* Section 2 — Specs */}
      <div style={sect}>
        <div style={sectH}>Specifications</div>
        <div style={{ ...row2, marginBottom:'1rem' }}>
          <div>
            <label style={label}>Transmission</label>
            <select {...register('transmission')} style={{ ...sel, textTransform:'capitalize' }}>
              <option value="">Select</option>
              {TRANSMISSIONS.map(t=><option key={t} value={t} style={{textTransform:'capitalize'}}>{t}</option>)}
            </select>
            {errors.transmission && <div style={errMsg}>{errors.transmission.message}</div>}
          </div>
          <div>
            <label style={label}>Fuel Type</label>
            <select {...register('fuelType')} style={{ ...sel, textTransform:'capitalize' }}>
              <option value="">Select</option>
              {FUEL_TYPES.map(f=><option key={f} value={f} style={{textTransform:'capitalize'}}>{f}</option>)}
            </select>
            {errors.fuelType && <div style={errMsg}>{errors.fuelType.message}</div>}
          </div>
        </div>
        <div style={row2}>
          <div>
            <label style={label}>Mileage</label>
            <input {...register('mileage')} type="number" placeholder="e.g. 45000" style={inp} />
            {errors.mileage && <div style={errMsg}>{errors.mileage.message}</div>}
          </div>
          <div>
            <label style={label}>Mileage Unit</label>
            <select {...register('mileageUnit')} style={sel}>
              <option value="km">km</option>
              <option value="miles">miles</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop:'1rem' }}>
          <label style={label}>Color</label>
          <input {...register('color')} placeholder="e.g. Pearl White" style={inp} />
        </div>
      </div>

      {/* Section 3 — Pricing */}
      <div style={sect}>
        <div style={sectH}>Pricing</div>
        <div style={row2}>
          <div>
            <label style={label}>Price</label>
            <input {...register('price')} type="number" placeholder="e.g. 85000" style={inp} />
            {errors.price && <div style={errMsg}>{errors.price.message}</div>}
          </div>
          <div>
            <label style={label}>Currency</label>
            <select {...register('currency')} style={sel}>
              <option value="GHS">GHS (Cedis)</option>
              <option value="USD">USD (Dollars)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 4 — Location */}
      <div style={sect}>
        <div style={sectH}>Location</div>
        <div style={row2}>
          <div>
            <label style={label}>Region</label>
            <select {...register('region')} style={sel}>
              <option value="">Select Region</option>
              {GHANA_REGIONS.map(r=><option key={r} value={r}>{r}</option>)}
            </select>
            {errors.region && <div style={errMsg}>{errors.region.message}</div>}
          </div>
          <div>
            <label style={label}>Location / Area</label>
            <input {...register('location')} placeholder="e.g. Spintex Road, Accra" style={inp} />
          </div>
        </div>
      </div>

      {/* Section 5 — Description */}
      <div style={sect}>
        <div style={sectH}>Description</div>
        <textarea {...register('description', { onChange: e => setDescLen(e.target.value.length) })}
          rows={6} maxLength={2000} placeholder="Describe the vehicle condition, history, features, accessories…"
          style={{ ...inp, resize:'vertical', lineHeight:1.65 }} />
        <div style={{ textAlign:'right', color: descLen > 1800 ? '#e05252' : '#555', fontSize:'0.75rem', marginTop:4 }}>
          {descLen}/2000
        </div>
      </div>

      {/* Section 6 — Images */}
      <div style={sect}>
        <div style={sectH}>Images <span style={{ color:'#555', fontWeight:400, textTransform:'none', fontSize:'0.78rem' }}>(max 10)</span></div>

        {/* Existing images */}
        {keptImgs.length > 0 && (
          <div style={{ marginBottom:'1rem' }}>
            <div style={{ color:'#666', fontSize:'0.75rem', marginBottom:6 }}>Current images</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
              {keptImgs.map(url => (
                <div key={url} style={{ position:'relative', width:90, height:64 }}>
                  <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:6, border:'1px solid #2a2a2a' }} />
                  <button type="button" onClick={() => removeExisting(url)}
                    style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%',
                      background:'#e05252', border:'none', color:'#fff', fontSize:'0.7rem',
                      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={e=>{e.preventDefault();setDragging(true);}}
          onDragLeave={()=>setDragging(false)}
          onDrop={onDrop}
          onClick={() => document.getElementById('img-upload').click()}
          style={{ border:`2px dashed ${dragging?'#c41e2a':'#2a2a2a'}`, borderRadius:8,
            padding:'2rem', textAlign:'center', cursor:'pointer', background: dragging?'#1a1a1a':'transparent',
            transition:'all 0.2s', marginBottom: previews.length ? '1rem' : 0 }}>
          <div style={{ color:'#555', fontSize:'0.88rem' }}>
            <span style={{ color:'#c41e2a', fontWeight:600 }}>Click to upload</span> or drag & drop
          </div>
          <div style={{ color:'#444', fontSize:'0.75rem', marginTop:4 }}>JPEG, PNG, WebP · Max 5MB each</div>
          <input id="img-upload" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden
            onChange={e=>addFiles(e.target.files)} />
        </div>

        {/* New previews */}
        {previews.length > 0 && (
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem', marginTop:'0.75rem' }}>
            {previews.map((src, i) => (
              <div key={i} style={{ position:'relative', width:90, height:64 }}>
                <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:6, border:'1px solid #2a2a2a' }} />
                <button type="button" onClick={() => removeNew(i)}
                  style={{ position:'absolute', top:-6, right:-6, width:20, height:20, borderRadius:'50%',
                    background:'#e05252', border:'none', color:'#fff', fontSize:'0.7rem',
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <div style={{ color:'#444', fontSize:'0.75rem', marginTop:6 }}>
          {keptImgs.length + newFiles.length}/10 images selected
        </div>
      </div>

      <button type="submit" disabled={loading}
        style={{ width:'100%', background:'#c41e2a', color:'#0d0d0d', border:'none',
          borderRadius:8, padding:'0.9rem', fontWeight:800, fontSize:'1rem',
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
        {loading ? 'Submitting…' : submitLabel}
      </button>
    </form>
  );
}
