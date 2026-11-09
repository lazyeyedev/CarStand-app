import { useState, forwardRef, useId } from 'react';
import Icon from './Icon';

// Label above, error under the field and wired to it with aria-describedby,
// so screen readers announce the error when the input is focused.
export const Field = forwardRef(function Field(
  { label, error, hint, as = 'input', children, className = '', id: idProp, ...rest }, ref,
) {
  const auto = useId();
  const id = idProp || auto;
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  const common = { id, ref, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy, ...rest };
  let control;
  if (as === 'select') control = <select className="select" {...common}>{children}</select>;
  else if (as === 'textarea') control = <textarea className="textarea" {...common} />;
  else control = <input className="input" {...common} />;
  return (
    <div className={`field ${className}`.trim()}>
      {label && <label className="label" htmlFor={id}>{label}</label>}
      {control}
      {hint && !error && <span id={`${id}-hint`} className="hint">{hint}</span>}
      {error && <span id={`${id}-err`} className="field-error" role="alert"><Icon name="alert" size={14} />{error}</span>}
    </div>
  );
});

export const PasswordField = forwardRef(function PasswordField({ label, error, hint, id: idProp, ...rest }, ref) {
  const [show, setShow] = useState(false);
  const auto = useId();
  const id = idProp || auto;
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <div className="input-wrap">
        <input
          id={id}
          ref={ref}
          className="input"
          type={show ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          {...rest}
        />
        <button type="button" className="input-toggle" onClick={() => setShow((p) => !p)} aria-pressed={show} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? 'HIDE' : 'SHOW'}
        </button>
      </div>
      {hint && !error && <span id={`${id}-hint`} className="hint">{hint}</span>}
      {error && <span id={`${id}-err`} className="field-error" role="alert"><Icon name="alert" size={14} />{error}</span>}
    </div>
  );
});

export function SubmitButton({ loading, loadingText, children, className = '' }) {
  return (
    <button type="submit" className={`btn btn-primary btn-block btn-lg ${className}`.trim()} disabled={loading}>
      {loading ? <><span className="spinner" /> {loadingText}</> : children}
    </button>
  );
}

export const PASSWORD_HINT = 'At least 8 characters, with a letter and a number.';
