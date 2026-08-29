// src/components/landlord/LandlordOverview.jsx
import React from 'react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';

export default function LandlordOverview({
  properties = [],
  bookings = [],
  applications = [],
  onNavigateTab,
  onAddProperty
}) {
  const activeProps = properties.filter((p) => p.isActive);
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const pendingApps = applications.filter((a) => a.status === 'pending');

  const totalRentRoll = activeProps.reduce((sum, p) => sum + Number(p.rent || 0), 0);

  return (
    <div>
      {/* Metrics Row */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{properties.length}</div>
          <div className="stat-label">Total Properties</div>
          <button
            onClick={() => onNavigateTab('properties')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'left', marginTop: '0.5rem' }}
          >
            {activeProps.length} active listings →
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-value">{pendingBookings.length}</div>
          <div className="stat-label">Pending Tour Requests</div>
          <button
            onClick={() => onNavigateTab('bookings')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'left', marginTop: '0.5rem' }}
          >
            Review bookings →
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-value">{pendingApps.length}</div>
          <div className="stat-label">Pending Applications</div>
          <button
            onClick={() => onNavigateTab('applications')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'left', marginTop: '0.5rem' }}
          >
            Review applicants →
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-value">৳{totalRentRoll.toLocaleString()}</div>
          <div className="stat-label">Potential Monthly Rent</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, marginTop: '0.5rem' }}>
            Across {activeProps.length} active units
          </div>
        </div>
      </div>

      {/* Action Banner */}
      <div
        className="rn-card"
        style={{
          padding: '1.5rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-subtle) 100%)'
        }}
      >
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Have a new vacant property?
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            List it on RentNest now to receive viewing tours and tenant applications.
          </p>
        </div>
        <Button variant="primary" onClick={onAddProperty}>
          + Add New Property
        </Button>
      </div>

      {/* Grid: Inbound Tours & Inbound Applications */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Incoming Bookings */}
        <div className="rn-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Inbound Viewing Requests</h4>
            <button onClick={() => onNavigateTab('bookings')} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
              View all ({bookings.length})
            </button>
          </div>

          {bookings.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem 0' }}>
              No incoming booking requests yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {bookings.slice(0, 4).map((b) => (
                <div
                  key={b._id}
                  style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                      {b.property?.title || 'Property'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Tenant: {b.tenant?.name || 'Tenant'} • {new Date(b.scheduledAt).toLocaleDateString()}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Incoming Applications */}
        <div className="rn-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Rental Applications</h4>
            <button onClick={() => onNavigateTab('applications')} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
              View all ({applications.length})
            </button>
          </div>

          {applications.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem 0' }}>
              No incoming rental applications yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {applications.slice(0, 4).map((a) => (
                <div
                  key={a._id}
                  style={{
                    padding: '0.85rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.925rem' }}>
                      {a.property?.title || 'Property'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Applicant: {a.tenant?.name || 'Tenant'} • Score: <b>{a.score}/100</b>
                    </div>
                  </div>
                  <StatusBadge status={a.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
