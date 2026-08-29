// src/components/landlord/LandlordApplications.jsx
import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function LandlordApplications({
  applications = [],
  loading = false,
  onRefresh,
  onOpenChat
}) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState(null);

  const handleUpdateStatus = async (applicationId, newStatus) => {
    setUpdatingId(applicationId);
    try {
      await api.patch(`/applications/${applicationId}/status`, { status: newStatus });
      toast.success(`Application marked as ${newStatus}`);
      if (onRefresh) onRefresh();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update application status';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading rental applications…</div>;
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No Rental Applications Yet"
        description="When tenants apply to rent your properties, their financial background, credit rating, and screening scores will appear here."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {applications.map((app) => {
        const prop = app.property || {};
        const tenant = app.tenant || {};
        const isPending = app.status === 'pending';

        return (
          <div
            key={app._id}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                  {prop.title || 'Property Application'}
                </h4>
                <StatusBadge status={app.status} />
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                👤 <b>Applicant:</b> {tenant.name} ({tenant.email})
              </p>

              {/* Applicant Screening Details */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem',
                  flexWrap: 'wrap',
                  color: 'var(--text-main)',
                  marginTop: '0.5rem'
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Screening Score: </span>
                  <b style={{ color: app.score >= 70 ? 'var(--success)' : 'var(--warning-text)' }}>
                    {app.score}/100
                  </b>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Monthly Income: </span>
                  <b>৳{Number(app.form?.incomeMonthly || 0).toLocaleString()}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Employment: </span>
                  <b>{app.form?.employmentStatus || 'N/A'}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Credit Score: </span>
                  <b>{app.form?.creditScore || 650}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Occupants: </span>
                  <b>{app.form?.occupants || 1}</b>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Pets: </span>
                  <b>{app.form?.pets ? 'Yes' : 'No'}</b>
                </div>
              </div>

              {app.form?.message && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  <b>Applicant Message:</b> "{app.form.message}"
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
              {isPending && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={updatingId === app._id}
                    onClick={() => handleUpdateStatus(app._id, 'approved')}
                  >
                    ✓ Approve Applicant
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={updatingId === app._id}
                    onClick={() => handleUpdateStatus(app._id, 'rejected')}
                  >
                    ✕ Decline
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
