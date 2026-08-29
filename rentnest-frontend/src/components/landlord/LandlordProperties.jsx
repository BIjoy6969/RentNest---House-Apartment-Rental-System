// src/components/landlord/LandlordProperties.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';
import { getImageUrl, DEFAULT_FALLBACK } from '../../utils/imageUrl';

export default function LandlordProperties({
  properties = [],
  loading = false,
  onAddProperty,
  onEditProperty,
  onRefresh
}) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (propertyId, title) => {
    if (!window.confirm(`Are you sure you want to delete the listing "${title}"? This will also remove all associated photos.`)) {
      return;
    }

    setDeletingId(propertyId);
    try {
      await api.delete(`/properties/${propertyId}`);
      toast.success('Property listing deleted successfully');
      if (onRefresh) onRefresh();
    } catch {
      toast.error('Failed to delete property listing');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your property listings…</div>;
  }

  if (properties.length === 0) {
    return (
      <EmptyState
        icon="🏢"
        title="No Properties Listed Yet"
        description="Add your house, apartment, or flat listing with photos to start receiving viewing bookings and applications from verified tenants."
        actionLabel="+ Add Your First Property"
        onAction={onAddProperty}
      />
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          My Listings ({properties.length})
        </h3>
        <Button variant="primary" size="sm" onClick={onAddProperty}>
          + Add Property
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {properties.map((p) => {
          const resolvedImg = p.primaryImage || p.imageUrl || (p.images && p.images[0]?.url);
          const photoCount = (p.images && p.images.length) || (p.imageUrl ? 1 : 0);

          return (
            <div
              key={p._id}
              className="rn-card"
              style={{
                padding: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                  <img
                    src={getImageUrl(resolvedImg)}
                    alt={p.title}
                    style={{ width: '110px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_FALLBACK;
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      right: '4px',
                      backgroundColor: 'rgba(0,0,0,0.7)',
                      color: '#fff',
                      fontSize: '0.65rem',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      fontWeight: 600
                    }}
                  >
                    📷 {photoCount}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{p.title}</h4>
                    <StatusBadge status={p.isActive ? 'active' : 'inactive'} label={p.isActive ? 'Active' : 'Draft / Off-Market'} />
                    {p.status === 'rented' && <StatusBadge status="danger" label="Rented" />}
                    {p.status === 'reserved' && <StatusBadge status="warning" label="Reserved" />}
                    {p.isFlagged && <StatusBadge status="flagged" label="Under Moderation" />}
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                    📍 {[p.address, p.city, p.state].filter(Boolean).join(', ')}
                  </p>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span><b>Rent:</b> ৳{Number(p.rent || 0).toLocaleString()} / mo</span>
                    <span><b>Bedrooms:</b> {p.bedrooms}</span>
                    <span><b>Bathrooms:</b> {p.bathrooms}</span>
                    <span><b>Quality Score:</b> {p.completenessScore || 80}%</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem' }}>
                <Link to={`/property/${p._id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
                <Button variant="secondary" size="sm" onClick={() => onEditProperty(p)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={deletingId === p._id}
                  onClick={() => handleDelete(p._id, p.title)}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
