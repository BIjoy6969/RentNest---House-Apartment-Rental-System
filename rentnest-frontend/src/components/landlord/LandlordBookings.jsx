// src/components/landlord/LandlordBookings.jsx
import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function LandlordBookings({
  bookings = [],
  loading = false,
  onRefresh,
  onOpenChat
}) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState(null);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingId(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/status`, { status: newStatus });
      toast.success(`Booking marked as ${newStatus}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update booking status';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading incoming viewing requests…</div>;
  }

  if (bookings.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No Booking Requests Yet"
        description="When tenants schedule a viewing tour for your properties, their requests will appear here for your review and confirmation."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {bookings.map((b) => {
        const prop = b.property || {};
        const tenant = b.tenant || {};
        const isPending = b.status === 'pending';

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
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {prop.title || 'Property'}
                </h4>
                <StatusBadge status={b.status} />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                👤 <b>Tenant:</b> {tenant.name} ({tenant.email})
              </p>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                📅 <b>Requested Tour Time:</b> {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString([], { dateStyle: 'full', timeStyle: 'short' }) : '—'}
              </div>
              {b.note && b.note !== '—' && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Tenant Note: "{b.note}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {isPending && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={updatingId === b._id}
                    onClick={() => handleUpdateStatus(b._id, 'approved')}
                  >
                    ✓ Approve Tour
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={updatingId === b._id}
                    onClick={() => handleUpdateStatus(b._id, 'rejected')}
                  >
                    ✕ Reject
                  </Button>
                </>
              )}

              {tenant._id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChat(prop._id, tenant._id, tenant.name)}
                >
                  💬 Message Tenant
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
