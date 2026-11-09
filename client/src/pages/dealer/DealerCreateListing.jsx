import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import DealerLayout from './DealerLayout';
import ListingForm from './ListingForm';
import { PageHeader } from '../../components/DashboardShell';
import axiosInstance from '../../api/axiosInstance';

export default function DealerCreateListing() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      await axiosInstance.post('/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Listing submitted for review');
      navigate('/dealer/listings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'The listing could not be created');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DealerLayout>
      <div style={{ maxWidth: 860 }}>
        <PageHeader
          back={{ to: '/dealer/listings', label: 'My listings' }}
          title="Add a listing"
          subtitle="An admin reviews each listing before it goes live."
        />
        <ListingForm onSubmit={handleSubmit} submitLabel="Submit for review" loading={loading} />
      </div>
    </DealerLayout>
  );
}
