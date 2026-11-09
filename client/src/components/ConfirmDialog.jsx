import { useEffect, useRef } from 'react';

// Replaces window.confirm(): styled to match, keyboard-safe (Escape cancels,
// focus starts on the safe choice), and announced as a dialog.
export default function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', danger = false, busy = false, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    cancelRef.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="modal-scrim" onClick={onCancel}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="cd-title" aria-describedby="cd-body" onClick={(e) => e.stopPropagation()}>
        <h2 id="cd-title" style={{ fontSize: 'var(--fs-xl)' }}>{title}</h2>
        {body && <p id="cd-body" className="mt-2 text-sm">{body}</p>}
        <div className="row gap-2 mt-6" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button ref={cancelRef} type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={busy}>
            {busy ? <><span className="spinner" /> Working…</> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
