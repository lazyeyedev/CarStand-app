import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from './Icon';

// Full-screen photo viewer with zoom and pan.
//
//   Mouse:    wheel to zoom at the cursor, drag to move, double-click to zoom in/out
//   Touch:    pinch to zoom, drag to move, double-tap to zoom, swipe for next/previous
//   Keyboard: ← → to change photo, + − to zoom, 0 to reset, Esc to close

const MIN = 1;
const MAX = 5;
const STEP = 1.5;       // zoom buttons and +/- keys
const DOUBLE_TAP = 2.5; // zoom level a double-click / double-tap jumps to
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export default function ImageLightbox({ images, index, onIndexChange, onClose, title, placeholder }) {
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const closeRef = useRef(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef({ t: 0, x: 0, y: 0 });

  const many = images.length > 1;
  const go = useCallback((d) => {
    if (many) onIndexChange((index + d + images.length) % images.length);
  }, [many, index, images.length, onIndexChange]);

  // Keep the photo from being dragged out of the frame: it can move only as
  // far as its zoomed size overhangs the stage.
  const limit = useCallback((s, x, y) => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return { s, x: 0, y: 0 };
    const maxX = Math.max(0, (img.offsetWidth * s - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * s - stage.clientHeight) / 2);
    return { s, x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  }, []);

  // Zoom to `nextScale`, keeping the point under (clientX, clientY) still.
  const zoomAt = useCallback((nextScale, clientX, clientY) => {
    const stage = stageRef.current;
    if (!stage) return;
    const { s, x, y } = viewRef.current;
    const ns = clamp(nextScale, MIN, MAX);
    const r = stage.getBoundingClientRect();
    const cx = (clientX ?? r.left + r.width / 2) - (r.left + r.width / 2);
    const cy = (clientY ?? r.top + r.height / 2) - (r.top + r.height / 2);
    const k = ns / s;
    setView(ns === MIN ? { s: MIN, x: 0, y: 0 } : limit(ns, cx - (cx - x) * k, cy - (cy - y) * k));
  }, [limit]);

  const reset = useCallback(() => setView({ s: 1, x: 0, y: 0 }), []);

  // A new photo starts fitted to the screen
  useEffect(() => { reset(); setLoaded(false); }, [index, reset]);

  // Lock the page behind the viewer, focus it, and hand focus back on close
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      if (previous && previous.focus) previous.focus();
    };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === '+' || e.key === '=') zoomAt(viewRef.current.s * STEP);
      else if (e.key === '-' || e.key === '_') zoomAt(viewRef.current.s / STEP);
      else if (e.key === '0') reset();
      else if (e.key === 'Tab') {
        // Keep Tab inside the viewer
        const nodes = stageRef.current?.parentElement.querySelectorAll('button:not([disabled])');
        if (!nodes || nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, onClose, reset, zoomAt]);

  // Wheel zoom. React attaches wheel listeners as passive, which can't stop
  // the page from scrolling, so this one is attached by hand.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0018));
      zoomAt(viewRef.current.s * factor, e.clientX, e.clientY);
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // Re-fit when the window or phone orientation changes
  useEffect(() => {
    const onResize = () => { const v = viewRef.current; setView(limit(v.s, v.x, v.y)); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [limit]);

  const spread = () => {
    const [a, b] = [...pointers.current.values()];
    return { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2 };
  };

  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const v = viewRef.current;
    if (pointers.current.size === 2) {
      const { d, mx, my } = spread();
      gesture.current = { type: 'pinch', d, s: v.s, mx, my, x: v.x, y: v.y };
    } else if (pointers.current.size === 1) {
      gesture.current = { type: 'drag', sx: e.clientX, sy: e.clientY, x: v.x, y: v.y, t: Date.now(), moved: false, onImage: e.target === imgRef.current };
      if (v.s > 1) setDragging(true);
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;

    if (g.type === 'pinch' && pointers.current.size >= 2) {
      const { d, mx, my } = spread();
      const stage = stageRef.current.getBoundingClientRect();
      const ns = clamp(g.s * (d / g.d), MIN, MAX);
      const k = ns / g.s;
      // Keep the point that was between the fingers under the fingers
      const cx = g.mx - (stage.left + stage.width / 2);
      const cy = g.my - (stage.top + stage.height / 2);
      const nx = cx - (cx - g.x) * k + (mx - g.mx);
      const ny = cy - (cy - g.y) * k + (my - g.my);
      setView(ns === MIN ? { s: MIN, x: 0, y: 0 } : limit(ns, nx, ny));
    } else if (g.type === 'drag') {
      const dx = e.clientX - g.sx;
      const dy = e.clientY - g.sy;
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true;
      const v = viewRef.current;
      if (v.s > 1) setView(limit(v.s, g.x + dx, g.y + dy));
    }
  };

  const onPointerUp = (e) => {
    const g = gesture.current;
    const had = pointers.current.size;
    pointers.current.delete(e.pointerId);
    setDragging(false);

    if (g?.type === 'pinch') {
      // One finger still down: carry on as a drag from where it is now
      const rest = [...pointers.current.values()][0];
      // Pinched nearly all the way back: settle on the fitted view
      if (viewRef.current.s < 1.15) { reset(); viewRef.current = { s: 1, x: 0, y: 0 }; }
      const v = viewRef.current;
      gesture.current = rest ? { type: 'drag', sx: rest.x, sy: rest.y, x: v.x, y: v.y, t: 0, moved: true } : null;
      return;
    }
    if (g?.type !== 'drag' || had !== 1) { gesture.current = null; return; }
    gesture.current = null;

    const dx = e.clientX - g.sx;
    const dy = e.clientY - g.sy;
    const v = viewRef.current;

    // Swipe between photos, only while the photo is not zoomed
    if (v.s === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      go(dx < 0 ? 1 : -1);
      return;
    }

    const isTap = !g.moved && Date.now() - g.t < 350;
    if (!isTap) return;

    const now = Date.now();
    const last = lastTap.current;
    if (g.onImage && now - last.t < 320 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 30) {
      lastTap.current = { t: 0, x: 0, y: 0 };
      if (v.s > 1) reset(); else zoomAt(DOUBLE_TAP, e.clientX, e.clientY);
    } else if (g.onImage) {
      lastTap.current = { t: now, x: e.clientX, y: e.clientY };
    } else {
      onClose(); // tap on the dark area around the photo
    }
  };

  const zoomed = view.s > 1;
  const pct = Math.round(view.s * 100);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={`${title} photos, full screen`}>
      <div className="lightbox-bar">
        <span className="lightbox-count" aria-live="polite">{many ? `${index + 1} / ${images.length}` : title}</span>
        <div className="lightbox-tools">
          <button type="button" className="lightbox-btn" onClick={() => zoomAt(view.s / STEP)} disabled={view.s <= MIN} aria-label="Zoom out" title="Zoom out (−)"><Icon name="zoomOut" /></button>
          <button type="button" className="lightbox-btn lightbox-pct" onClick={reset} disabled={!zoomed} aria-label={`Zoom ${pct} percent. Reset zoom`} title="Reset zoom (0)">{pct}%</button>
          <button type="button" className="lightbox-btn" onClick={() => zoomAt(view.s * STEP)} disabled={view.s >= MAX} aria-label="Zoom in" title="Zoom in (+)"><Icon name="zoomIn" /></button>
          <button type="button" className="lightbox-btn" onClick={onClose} ref={closeRef} aria-label="Close photo viewer" title="Close (Esc)"><Icon name="x" /></button>
        </div>
      </div>

      <div
        className={`lightbox-stage${zoomed ? ' is-zoomed' : ''}${dragging ? ' is-dragging' : ''}`}
        ref={stageRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {!loaded && <span className="spinner lightbox-spinner" aria-hidden="true" />}
        <img
          key={images[index]}
          ref={imgRef}
          src={images[index]}
          alt={`${title} (${index + 1} of ${images.length})`}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={(e) => { setLoaded(true); if (placeholder) e.currentTarget.src = placeholder; }}
          style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.s})`, transition: dragging || pointers.current.size > 0 ? 'none' : undefined }}
        />
      </div>

      {many && (
        <>
          <button type="button" className="lightbox-nav prev" onClick={() => go(-1)} aria-label="Previous photo"><Icon name="chevLeft" /></button>
          <button type="button" className="lightbox-nav next" onClick={() => go(1)} aria-label="Next photo"><Icon name="chevRight" /></button>
        </>
      )}

      <p className="lightbox-hint" aria-hidden="true">
        <span className="hint-mouse">Scroll or double-click to zoom · drag to move</span>
        <span className="hint-touch">Pinch or double-tap to zoom · swipe for more photos</span>
      </p>
    </div>
  );
}
