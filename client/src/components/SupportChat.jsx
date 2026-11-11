import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';
import { CATEGORIES, GREETING, SUPPORT_CONTACT } from '../utils/supportContent';

// A scripted help widget: fixed questions and answers from supportContent.js,
// shown as a chat. No AI and no network calls — it can only say what is
// written in that file.

const waNumber = SUPPORT_CONTACT.whatsapp ? String(SUPPORT_CONTACT.whatsapp).replace(/\D/g, '') : '';
const hasHuman = Boolean(waNumber || SUPPORT_CONTACT.email);

let nextId = 1;
const msg = (from, body) => ({ id: nextId++, from, ...body });

export default function SupportChat() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState(null);
  const [messages, setMessages] = useState(() => [msg('bot', { paras: [GREETING] })]);
  const logRef = useRef(null);
  const panelRef = useRef(null);
  const launcherRef = useRef(null);
  const wasOpen = useRef(false);

  const role = user?.role === 'dealer' ? 'dealer' : user?.role === 'user' ? 'user' : user ? 'other' : 'guest';
  const fits = (audience = 'all') =>
    audience === 'all' ||
    audience === role ||
    (audience === 'signedIn' && role !== 'guest');

  // Keep the newest message in view
  useEffect(() => {
    if (open && logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, open, category]);

  // Move focus into the panel on open and back to the launcher on close
  useEffect(() => {
    if (open) panelRef.current?.focus();
    else if (wasOpen.current) launcherRef.current?.focus();
    wasOpen.current = open;
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  // Following a link from an answer closes the panel so the page is visible
  useEffect(() => { setOpen(false); }, [pathname]);

  // The admin panel has its own layout and audience
  if (pathname.startsWith('/admin')) return null;

  const ask = (question) => {
    setMessages((m) => [
      ...m,
      msg('user', { paras: [question.q] }),
      msg('bot', { paras: question.answer, links: (question.links || []).filter((l) => fits(l.audience)) }),
    ]);
  };

  const askHuman = () => {
    setMessages((m) => [
      ...m,
      msg('user', { paras: ['I need to talk to a person'] }),
      msg('bot', { paras: ['You can reach the Carmium team here:'], human: true }),
    ]);
  };

  const restart = () => {
    setCategory(null);
    setMessages([msg('bot', { paras: [GREETING] })]);
  };

  const categories = CATEGORIES
    .map((c) => ({ ...c, questions: c.questions.filter((q) => fits(q.audience)) }))
    .filter((c) => c.questions.length > 0);
  const active = categories.find((c) => c.id === category);

  return (
    <div className="support">
      {open && (
        <section
          className="support-panel"
          role="dialog"
          aria-label="Carmium help"
          tabIndex={-1}
          ref={panelRef}
        >
          <header className="support-head">
            <div>
              <div className="support-title">Carmium help</div>
              <div className="support-sub">Quick answers to common questions</div>
            </div>
            <div className="row gap-1">
              {messages.length > 1 && (
                <button type="button" className="support-icon-btn" onClick={restart} aria-label="Start over" title="Start over">
                  <Icon name="refresh" />
                </button>
              )}
              <button type="button" className="support-icon-btn" onClick={() => setOpen(false)} aria-label="Close help">
                <Icon name="x" />
              </button>
            </div>
          </header>

          <div className="support-log" ref={logRef} role="log" aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={`support-msg support-msg-${m.from}`}>
                {m.paras.map((p, i) => <p key={i}>{p}</p>)}
                {m.links?.length > 0 && (
                  <div className="support-links">
                    {m.links.map((l) => (
                      <Link key={l.to} to={l.to} className="btn btn-secondary btn-sm">{l.label} <Icon name="arrowRight" /></Link>
                    ))}
                  </div>
                )}
                {m.human && (
                  <div className="support-links">
                    {waNumber && (
                      <a className="btn btn-secondary btn-sm" href={`https://wa.me/${waNumber}`} target="_blank" rel="noopener noreferrer">
                        <Icon name="whatsapp" /> WhatsApp
                      </a>
                    )}
                    {SUPPORT_CONTACT.email && (
                      <a className="btn btn-secondary btn-sm" href={`mailto:${SUPPORT_CONTACT.email}`}>
                        <Icon name="mail" /> {SUPPORT_CONTACT.email}
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="support-options">
            {!active ? (
              <>
                <div className="support-options-label">Choose a topic</div>
                <div className="support-chips">
                  {categories.map((c) => (
                    <button key={c.id} type="button" className="support-chip" onClick={() => setCategory(c.id)}>{c.label}</button>
                  ))}
                  {hasHuman && (
                    <button type="button" className="support-chip" onClick={askHuman}>Talk to a person</button>
                  )}
                </div>
              </>
            ) : (
              <>
                <button type="button" className="support-back" onClick={() => setCategory(null)}>
                  <Icon name="chevLeft" /> {active.label}
                </button>
                <div className="support-chips">
                  {active.questions.map((q) => (
                    <button key={q.id} type="button" className="support-chip" onClick={() => ask(q)}>{q.q}</button>
                  ))}
                  {hasHuman && (
                    <button type="button" className="support-chip" onClick={askHuman}>Something else — talk to a person</button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      <button
        type="button"
        ref={launcherRef}
        className="support-launcher"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close help' : 'Open help'}
      >
        <Icon name={open ? 'x' : 'message'} />
        {!open && <span>Help</span>}
      </button>
    </div>
  );
}
