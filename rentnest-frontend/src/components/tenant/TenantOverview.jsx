import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import { recommendationService } from '../../services/recommendationService';

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

  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  useEffect(() => {
    const fetchRecs = async () => {
      setLoadingRecs(true);
      try {
        const res = await recommendationService.getRecommendations();
        setRecommendations(res?.recommendations || []);
      } catch (err) {
        console.error('Failed to fetch recommendations', err);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecs();
  }, []);

  return (
    <div>
      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{wishlist.length}</div>
          <div className="stat-label">Saved Properties</div>
          <button
            onClick={() => onNavigateTab('wishlist')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'left', marginTop: '0.5rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            View Wishlist →
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">Total Tour Bookings</div>
          <button
            onClick={() => onNavigateTab('bookings')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'left', marginTop: '0.5rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            {pendingBookings.length} pending approval →
          </button>
        </div>

        <div className="stat-card">
          <div className="stat-value">{applications.length}</div>
          <div className="stat-label">Rental Applications</div>
          <button
            onClick={() => onNavigateTab('applications')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'left', marginTop: '0.5rem', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
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

      {/* Smart Recommendations */}
      <div className="rn-card" style={{ padding: '1.5rem', marginTop: '1.5rem', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✨ Smart Recommendations
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Properties matched to your rental preferences. Update your profile to improve matches.
            </p>
          </div>
          <button onClick={() => onNavigateTab('profile')} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
            Edit Preferences
          </button>
        </div>

        {loadingRecs ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Analyzing matches...</p>
        ) : recommendations.length === 0 ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            No strong matches found yet. Try updating your rental preferences.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {recommendations.slice(0, 4).map((rec) => (
              <Link
                to={`/properties/${rec.property._id}`}
                key={rec.property._id}
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  backgroundColor: 'white',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
              >
                <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {rec.property.title}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  ৳{rec.property.rent}/mo • {rec.property.location?.area || 'Dhaka'}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.5rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary-dark)', borderRadius: '1rem' }}>
                    {Math.round(rec.matchScore)}% Match
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {rec.reasons?.[0]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Upcoming Viewings */}
        <div className="rn-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Upcoming Viewings</h4>
            <button onClick={() => onNavigateTab('bookings')} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
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
                      📅 {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}
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
            <button onClick={() => onNavigateTab('applications')} style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
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
