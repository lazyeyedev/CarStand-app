import { useEffect, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import DealerLayout from './DealerLayout';
import Icon from '../../components/Icon';
import axiosInstance from '../../api/axiosInstance';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

// Paystack sends the dealer back here with ?reference=… (and ?trxref=…).
export default function DealerBoostSuccess() {
  const [searchParams] = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  const [status, setStatus] = useState('loading'); // loading | active | error
  const [boost, setBoost] = useState(null);
  const [message, setMessage] = useState('');
  const asked = useRef(false);

  useEffect(() => {
    if (asked.current) return; // React 18+ runs effects twice in development
    asked.current = true;

    if (!reference) { setStatus('error'); setMessage('No payment reference was found in this link.'); return; }

    axiosInstance.get(`/boosts/verify/${encodeURIComponent(reference)}`)
      .then(({ data }) => { setBoost(data.boost); setStatus('active'); })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'This payment could not be confirmed.');
      });
  }, [reference]);

  return (
    <DealerLayout>
      <div className="card card-pad stack gap-4" style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center', alignItems: 'center' }} role="status" aria-live="polite">
        {status === 'loading' && (
          <>
            <span className="spinner" style={{ width: 32, height: 32 }} />
            <h1 style={{ fontSize: 'var(--fs-xl)' }}>Confirming your payment…</h1>
            <p className="muted">This takes a few seconds. Please keep this page open.</p>
          </>
        )}

        {status === 'active' && boost && (
          <>
            <span style={{ color: 'var(--color-success)', display: 'inline-flex' }}><Icon name="checkCircle" size={44} /></span>
            <h1 style={{ fontSize: 'var(--fs-xl)' }}>Your listing is now featured</h1>
            <p className="muted">{boost.listing?.title || 'Your listing'} is featured until <strong style={{ color: 'var(--color-text)' }}>{fmtDate(boost.endDate)}</strong>.</p>
            <dl className="boost-receipt">
              <div><dt>Duration</dt><dd>{boost.durationDays} days</dd></div>
              <div><dt>Amount paid</dt><dd>GHS {boost.amountPaid?.toLocaleString()}</dd></div>
              <div><dt>Runs</dt><dd>{fmtDate(boost.startDate)} to {fmtDate(boost.endDate)}</dd></div>
              <div><dt>Payment reference</dt><dd style={{ wordBreak: 'break-all' }}>{boost.paystackReference}</dd></div>
            </dl>
          </>
        )}

        {status === 'error' && (
          <>
            <span style={{ color: 'var(--color-error)', display: 'inline-flex' }}><Icon name="alert" size={44} /></span>
            <h1 style={{ fontSize: 'var(--fs-xl)' }}>We couldn't confirm this payment</h1>
            <p className="muted">{message}</p>
            {reference && <p className="text-sm muted">Payment reference: <span style={{ wordBreak: 'break-all' }}>{reference}</span></p>}
          </>
        )}

        {status !== 'loading' && <Link to="/dealer/listings" className="btn btn-primary">Back to my listings</Link>}
      </div>
    </DealerLayout>
  );
}
