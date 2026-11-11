import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DealerLayout from './DealerLayout';
import ListingForm from './ListingForm';
import { PageHeader } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';

export default function DealerEditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // Dealer-only endpoint: the public one hides pending and inactive listings,
    // which made those impossible to open for editing.
    axiosInstance.get(`/listings/dealer/mine/${id}`)
      .then((r) => setListing(r.data))
      .catch(() => { toast.error('Listing not found'); navigate('/dealer/listings'); })
      .finally(() => setFetching(false));
  }, [id, navigate]);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.put(`/listings/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data?.resubmitted) {
        toast.info('Saved. Because the car details or photos changed, the listing is back in review and will reappear once approved.', { autoClose: 8000 });
      } else {
        toast.success('Listing updated');
      }
      navigate('/dealer/listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Your changes could not be saved');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DealerLayout>
      <div style={{ maxWidth: 860 }}>
        <PageHeader
          back={{ to: '/dealer/listings', label: 'My listings' }}
          title="Edit listing"
          subtitle={listing?.title || 'Loading…'}
        />
        {fetching ? (
          <div className="stack gap-4">
            {[180, 260, 220].map((h) => <div key={h} className="skeleton" style={{ height: h, borderRadius: 'var(--radius-md)' }} />)}
          </div>
        ) : listing && (
          <ListingForm
            defaultValues={listing}
            existingImages={listing.images || []}
            onSubmit={handleSubmit}
            submitLabel="Save changes"
            loading={loading}
          />
        )}
      </div>
    </DealerLayout>
  );
}
