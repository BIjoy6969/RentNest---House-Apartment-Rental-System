// src/components/tenant/TenantApplications.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

export default function TenantApplications({
  applications = [],
  loading = false,
  onOpenChat
}) {
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your applications…</div>;
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No Rental Applications Submitted"
        description="Found a property you love? Submit a digital rental application directly from the listing page."
        actionText="Find Properties"
        onAction={() => window.location.href = '/properties'}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {applications.map((app) => {
        const prop = app.property || {};
        const landlord = app.landlord || {};

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
                📍 {[prop.address, prop.city].filter(Boolean).join(', ')} • ৳{Number(prop.rent || 0).toLocaleString()} / month
              </p>

              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-main)', flexWrap: 'wrap' }}>
                <span><b>Screening Score:</b> {app.score}/100</span>
                <span><b>Monthly Income:</b> ৳{Number(app.form?.incomeMonthly || 0).toLocaleString()}</span>
                <span><b>Occupants:</b> {app.form?.occupants || 1}</span>
                <span><b>Submitted:</b> {new Date(app.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              {prop._id && (
                <Link to={`/property/${prop._id}`}>
                  <Button variant="secondary" size="sm">
                    Listing
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
