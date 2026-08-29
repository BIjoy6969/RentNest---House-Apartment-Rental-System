// src/components/tenant/TenantBookings.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function TenantBookings({
  bookings = [],
  loading = false,
  onRefresh,
  onOpenChat
}) {
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState(null);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this viewing appointment?')) return;
    setCancellingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/cancel`);
      toast.success('Viewing appointment cancelled');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error('Could not cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your bookings…</div>;
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No Viewing Requests Yet"
        description="Browse available properties and schedule a viewing appointment to tour homes."
        actionText="Explore Properties"
        onAction={() => window.location.href = '/properties'}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {bookings.map((b) => {
        const prop = b.property || {};
        const landlord = b.landlord || {};
        const canCancel = ['pending', 'approved'].includes(b.status);

        return (
          <div
            key={b._id}
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
              <img
                src={prop.imageUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop'}
                alt={prop.title}
                style={{ width: '100px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                    {prop.title || 'Property'}
                  </h4>
                  <StatusBadge status={b.status} />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  📍 {[prop.address, prop.city, prop.state].filter(Boolean).join(', ')}
                </p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  <b>Scheduled for:</b> {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : '—'}
                </div>
                {b.note && b.note !== '—' && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Note: "{b.note}"
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {prop._id && (
                <Link to={`/property/${prop._id}`}>
                  <Button variant="secondary" size="sm">
                    View Listing
                  </Button>
                </Link>
              )}
              {landlord._id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChat(prop._id, landlord._id, landlord.name)}
                >
                  💬 Message Landlord
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={cancellingId === b._id}
                  onClick={() => handleCancelBooking(b._id)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
