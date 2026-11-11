// Installable-app plumbing: registers the service worker and exposes the
// browser's "install this app" prompt to the UI.

// Android and desktop Chrome fire this when the site qualifies for install.
// The event is kept so a button can trigger the prompt later.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

export const canInstall = () => Boolean(deferredPrompt);

export const promptInstall = async () => {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null; // a prompt can only be used once
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  notify();
  return outcome === 'accepted';
};

export const onInstallChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

// True when running as an installed app rather than in a browser tab.
export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

// iPhones and iPads have no install prompt; the person uses Share > Add to Home Screen.
export const isIos = () =>
  typeof navigator !== 'undefined' &&
  (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// Production only: in development a service worker would serve stale files
// and hide your changes.
export const registerServiceWorker = () => {
  if (process.env.NODE_ENV !== 'production') return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => { /* the site works without it */ });
  });
};
