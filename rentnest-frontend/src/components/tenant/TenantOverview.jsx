// src/components/tenant/TenantOverview.jsx
import React from 'react';
import StatusBadge from '../common/StatusBadge';

export default function TenantOverview({
  user,
  bookings = [],
  applications = [],
  wishlist = [],
  onNavigateTab
}) {
  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const approvedBookings = bookings.filter((b) => b.status === 'approved');
  const pendingApps = applications.filter((a) => a.status === 'pending');

  return (
    <div>
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{wishlist.length}</div>
          <div className="stat-label">Saved Properties</div>
          <button
            onClick={() => onNavigateTab('wishlist')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'left', marginTop: '0.5rem' }}
          >
            View Wishlist →
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">Total Tour Bookings</div>
          <button
            onClick={() => onNavigateTab('bookings')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'left', marginTop: '0.5rem' }}
          >
            {pendingBookings.length} pending approval →
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-value">{applications.length}</div>
          <div className="stat-label">Rental Applications</div>
          <button
            onClick={() => onNavigateTab('applications')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'left', marginTop: '0.5rem' }}
          >
            {pendingApps.length} under review →
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-value">{approvedBookings.length}</div>
          <div className="stat-label">Approved Tours</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600, marginTop: '0.5rem' }}>
            Ready for viewing
          </div>
        </div>
      </div>

      {/* Recent Activity Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Upcoming Viewings */}
        <div className="rn-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Upcoming Viewings</h4>
            <button onClick={() => onNavigateTab('bookings')} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
              See all ({bookings.length})
            </button>
          </div>

          {bookings.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem 0' }}>
              No tours scheduled yet. Explore listings to book a tour.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {bookings.slice(0, 3).map((b) => (
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
                      📅 {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="rn-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Applications</h4>
            <button onClick={() => onNavigateTab('applications')} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
              See all ({applications.length})
            </button>
          </div>

          {applications.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', padding: '1rem 0' }}>
              No rental applications submitted yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {applications.slice(0, 3).map((a) => (
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
                      Screening Score: <b>{a.score}/100</b>
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
