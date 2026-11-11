import { useEffect, useState } from 'react';
import Icon from './Icon';
import { canInstall, onInstallChange, promptInstall } from '../pwa';

// A thin bar across the top while the device has no connection.
export function OfflineBanner() {
  const [offline, setOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    // Re-check when the app comes back to the foreground: a phone can lose
    // signal while the app is in the background without firing an event.
    const check = () => setOffline(navigator.onLine === false);
    check();
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);

  if (!offline) return null;
  return (
    <div className="offline-banner" role="status">
      <Icon name="alert" /> You're offline. Some things won't load until you're back online.
    </div>
  );
}

// "Install app" — only rendered when the browser says the app can be installed
// (Android and desktop Chrome/Edge). Renders nothing everywhere else.
export function InstallAppButton({ className = 'btn btn-secondary btn-sm' }) {
  const [available, setAvailable] = useState(canInstall());

  useEffect(() => onInstallChange(() => setAvailable(canInstall())), []);

  if (!available) return null;
  return (
    <button type="button" className={className} onClick={() => promptInstall()}>
      <Icon name="upload" style={{ transform: 'rotate(180deg)' }} /> Install the app
    </button>
  );
}
