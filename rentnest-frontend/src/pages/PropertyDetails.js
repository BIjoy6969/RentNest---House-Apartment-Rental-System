// src/pages/PropertyDetails.js
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function PropertyDetails() {
  const { id } = useParams();
  const loc = useLocation();
  const nav = useNavigate();
  const { user } = useAuth();

  const [p, setP] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(res => setP(res.data))
      .catch(() => setP(null));
  }, [id]);

  // if opened as /property/:id?book=1, auto-open the booking form
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    if (params.get('book') === '1') setShowForm(true);
  }, [loc.search]);

  const requireLogin = () => {
    alert('Please sign in first.');
    nav('/login', { state: { next: `/property/${id}?book=1` } });
  };

  const addToWishlist = async () => {
    if (!user) return requireLogin();
    try {
      await api.post(`/favorites/${id}`); // idempotent add
      alert('Added to wishlist.');
    } catch {
      alert('Could not add to wishlist.');
    }
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    if (!user) return requireLogin();
    if (!when) { alert('Pick a date & time.'); return; }

    setSaving(true);
    try {
      // Create booking (backend expects "property")
      await api.post('/bookings', {
        property: id,
        scheduledAt: new Date(when).toISOString(),
        note: note || '—',
      });

      // Auto-add to wishlist (safe even if already added)
      await api.post(`/favorites/${id}`);

      alert('Booking successful! The property was added to your wishlist.');
      nav('/tenant');
    } catch (e) {
      console.error(e);
      alert('Booking failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!p) return <div className="container">Loading…</div>;

  return (
    <div className="container">
      <h2 style={{ margin: '18px 0' }}>{p.title}</h2>

      <img
        src={p.imageUrl || 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop'}
        alt={p.title}
        style={{ width: '100%', maxHeight: 360, objectFit: 'cover', borderRadius: 12 }}
      />

      <p style={{ marginTop: 12 }}>{p.description}</p>
      <div className="card-meta" style={{ marginTop: 6 }}>
        Address: {p.address}, {p.city}, {p.state}, {p.country}
      </div>
      <div className="card-meta" style={{ marginTop: 6 }}>
        Rent: <b>{p.rent}</b> / month
      </div>

      {!showForm ? (
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button
            className="btn"
            onClick={() => {
              if (!user) return requireLogin();
              setShowForm(true);
            }}
          >
            Book Now
          </button>
          <button className="btn secondary" onClick={addToWishlist}>
            Add to Wishlist
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <h3>Booking application</h3>
          <form className="stack" onSubmit={submitBooking} style={{ maxWidth: 520 }}>
            <div>
              <div className="label">Preferred date & time</div>
              <input
                type="datetime-local"
                className="input"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="label">Note (optional)</div>
              <input
                className="input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any preference for viewing?"
              />
            </div>
            <button className="btn" disabled={saving}>
              {saving ? 'Submitting…' : 'Confirm booking'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
