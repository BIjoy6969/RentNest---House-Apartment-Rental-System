// src/pages/TenantDashboard.js
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import ChatBox from '../components/ChatBox';
import PropertyFilters from '../components/PropertyFilters';

export default function TenantDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();

  // ---- State
  const [loadingProps, setLoadingProps] = useState(true);
  const [properties, setProperties] = useState([]);   // public list
  const [wishlist, setWishlist] = useState([]);       // favorites
  const [bookings, setBookings] = useState([]);       // tenant bookings
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [saving, setSaving] = useState(null);         // property id saving to wishlist
  const [filters, setFilters] = useState({});         // { city, minRent, maxRent }

  // Chat modal state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPropId, setChatPropId] = useState('');
  const [chatPeerId, setChatPeerId] = useState('');

  // ---- Helpers (HOOKS must be before any early returns)
  const wishIds = useMemo(() => {
    const ids = new Set();
    for (const w of wishlist || []) ids.add(typeof w === 'string' ? w : w._id);
    return ids;
  }, [wishlist]);

  const inWishlist = useCallback((id) => wishIds.has(id), [wishIds]);

  // ---- Loaders
  const loadProperties = useCallback(async (params = {}) => {
    setLoadingProps(true);
    try {
      const res = await api.get('/properties', { params });
      setProperties(res.data || []);
    } catch (e) {
      console.error('Failed to load properties', e);
      setProperties([]);
    } finally {
      setLoadingProps(false);
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    try {
      // backend supports /favorites/mine and can return populated docs if asked
      const favRes = await api.get('/favorites/mine', { params: { populated: 1 } });
      setWishlist(favRes.data || []);
    } catch (e) {
      console.error('Failed to load wishlist', e);
      setWishlist([]);
    }
  }, []);

  const loadBookings = useCallback(async () => {
    try {
      setLoadingBookings(true);
      let res;
      try {
        res = await api.get('/bookings/mine');   // preferred
      } catch (e) {
        if (e?.response?.status === 404) {
          res = await api.get('/bookings/me');   // legacy fallback
        } else {
          throw e;
        }
      }
      setBookings(res.data || []);
    } catch (e) {
      console.error('Failed to load bookings', e);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  // Initial + filters change
  useEffect(() => {
    if (!user || user.role !== 'tenant') return;
    loadProperties(filters);
    loadWishlist();
    loadBookings();
  }, [user, filters, loadProperties, loadWishlist, loadBookings]);

  // ---- Wishlist actions
  const refreshWishlist = useCallback(async () => {
    try {
      const favRes = await api.get('/favorites/mine', { params: { populated: 1 } });
      setWishlist(favRes.data || []);
    } catch (e) {
      console.error('Failed to refresh wishlist', e);
    }
  }, []);

  const addToWishlist = useCallback(async (id) => {
    try {
      setSaving(id);
      await api.post(`/favorites/${id}`);     // POST /api/favorites/:id
      await refreshWishlist();
    } catch (e) {
      console.error(e);
      alert('Failed to add to wishlist.');
    } finally {
      setSaving(null);
    }
  }, [refreshWishlist]);

  const removeFromWishlist = useCallback(async (id) => {
    try {
      setSaving(id);
      await api.delete(`/favorites/${id}`);   // DELETE /api/favorites/:id
      await refreshWishlist();
    } catch (e) {
      console.error(e);
      alert('Failed to remove from wishlist.');
    } finally {
      setSaving(null);
    }
  }, [refreshWishlist]);

  const toggleWishlist = useCallback((id) => {
    if (inWishlist(id)) return removeFromWishlist(id);
    return addToWishlist(id);
  }, [inWishlist, addToWishlist, removeFromWishlist]);

  // ---- Early returns AFTER hooks (to keep hook order stable)
  if (!user) return <div className="container">Please sign in first.</div>;
  if (user.role !== 'tenant') return <div className="container">Forbidden: Tenant access only.</div>;

  // ---- Booking + Messaging
  const bookNow = (id) => {
    nav(`/property/${id}?book=1`);
  };

  const openMessage = (propertyId, landlordId) => {
    setChatPropId(propertyId);
    setChatPeerId(landlordId);
    setChatOpen(true);
  };

  // ---- UI
  return (
    <div className="container">
      <h2 style={{ margin: '18px 0' }}>Tenant Dashboard</h2>
      <p>Welcome, {user?.name || 'tenant'}.</p>

      {/* Filters */}
      <h3 style={{ margin: '18px 0 8px' }}>Filter Available Properties</h3>
      <PropertyFilters
        initial={filters}
        onApply={(f) => setFilters(f)}
      />

      {/* Available Properties */}
      <h3 style={{ margin: '18px 0' }}>Available Properties</h3>
      {loadingProps ? (
        <p>Loading…</p>
      ) : (
        <div className="grid cards">
          {properties.length === 0 && <p>No properties match your filters.</p>}
          {properties.map((p) => (
            <div key={p._id} className="card">
              <img
                src={
                  p.imageUrl ||
                  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop'
                }
                alt={p.title}
              />
              <div className="card-body">
                <div className="card-title">{p.title}</div>
                <div className="card-meta">
                  {p.city}, {p.state} • <span className="badge">{p.bedrooms} bed</span>
                  <span className="badge">{p.bathrooms} bath</span>
                </div>
                <div className="card-meta" style={{ marginTop: 6 }}>
                  Rent: <b>{p.rent}</b> / month
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <button className="btn" onClick={() => bookNow(p._id)}>Book Now</button>
                  <button
                    className="btn secondary"
                    disabled={saving === p._id}
                    onClick={() => toggleWishlist(p._id)}
                  >
                    {saving === p._id
                      ? 'Saving…'
                      : (inWishlist(p._id) ? 'Remove from wishlist' : 'Add to wishlist')}
                  </button>
                  <Link className="btn secondary" to={`/property/${p._id}`}>Details</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking History */}
      <h3 style={{ margin: '24px 0 12px' }}>My Booking History</h3>
      {loadingBookings ? (
        <p>Loading bookings…</p>
      ) : bookings.length === 0 ? (
        <p>No bookings yet.</p>
      ) : (
        <div className="grid cards">
          {bookings.map((b) => {
            const p = b.property || {};
            const landlordId = b.landlord?._id || b.landlord;
            return (
              <div key={b._id} className="card">
                <div className="card-body">
                  <div className="card-title">
                    {p.title || 'Property'}{' '}
                    <span className={`pill ${b.status || 'pending'}`}>{b.status || 'pending'}</span>
                  </div>
                  <div className="card-meta">
                    Viewing: {b.scheduledAt ? new Date(b.scheduledAt).toLocaleString() : '—'}
                  </div>
                  <div className="card-meta">
                    Address: {[p.address, p.city, p.state, p.country].filter(Boolean).join(', ') || '—'}
                  </div>
                  {b.note && <div className="card-meta">Note: {b.note}</div>}
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    {p._id && <Link className="btn" to={`/property/${p._id}`}>Details</Link>}
                    {p._id && landlordId && (
                      <button className="btn secondary" onClick={() => openMessage(p._id, landlordId)}>
                        Message landlord
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Wishlist */}
      <h3 style={{ margin: '24px 0 12px' }}>My Wishlist</h3>
      <div className="grid cards">
        {wishIds.size === 0 && <p>No items in wishlist yet.</p>}
        {Array.from(wishIds).map((id) => {
          const p =
            (wishlist.find(w => (typeof w !== 'string') && w._id === id)) ||
            properties.find(x => x._id === id) ||
            null;

          if (!p) {
            return (
              <div key={id} className="card">
                <div className="card-body">
                  <div className="card-title">Property</div>
                  <div className="card-meta">ID: {id}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <Link className="btn" to={`/property/${id}`}>Details</Link>
                    <button className="btn secondary" disabled={saving === id} onClick={() => removeFromWishlist(id)}>
                      {saving === id ? 'Saving…' : 'Remove'}
                    </button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={id} className="card">
              <img
                src={
                  p.imageUrl ||
                  'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop'
                }
                alt={p.title}
              />
              <div className="card-body">
                <div className="card-title">{p.title}</div>
                <div className="card-meta">
                  {p.city}, {p.state} • <span className="badge">{p.bedrooms} bed</span>
                  <span className="badge">{p.bathrooms} bath</span>
                </div>
                <div className="card-meta" style={{ marginTop: 6 }}>
                  Rent: <b>{p.rent}</b> / month
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  <Link className="btn" to={`/property/${p._id}`}>Details</Link>
                  <button
                    className="btn secondary"
                    disabled={saving === id}
                    onClick={() => removeFromWishlist(id)}
                  >
                    {saving === id ? 'Saving…' : 'Remove from wishlist'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="footer-space" />

      {/* In-app chat modal */}
      {chatOpen && (
        <ChatBox
          propertyId={chatPropId}
          withUserId={chatPeerId}
          onClose={() => setChatOpen(false)}
          title="Message landlord"
        />
      )}
    </div>
  );
}
