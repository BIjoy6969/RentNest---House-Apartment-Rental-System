// src/pages/LandingPage.js
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import PropertyFilters from '../components/PropertyFilters';

export default function LandingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({}); // {city, minRent, maxRent}
  const nav = useNavigate();
  const { user } = useAuth();

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/properties', { params });
      setItems(res.data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filters);
  }, [load, filters]);

  const handleBook = (id) => {
    if (!user) {
      alert('Please sign in to book a viewing.');
      nav('/login', { replace: true, state: { next: `/property/${id}?book=1` } });
      return;
    }
    nav(`/property/${id}?book=1`);
  };

  return (
    <>
      {/* Hero Section */}
      <div className="hero">
        <div className="inner">
          <div className="kicker">Find your next home</div>
          <h1>Modern rentals, zero hassle</h1>
          <p>Browse verified properties, book a viewing, and apply online. Simple.</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="container">
        <div className="topbar">
          <div className="notice">
            New here? Click <b>Register</b> on the top right to create an account.
          </div>
        </div>

        {/* Filters */}
        <div style={{margin:'10px 0 14px'}}>
          <PropertyFilters
            initial={filters}
            onApply={(f) => setFilters(f)}
          />
        </div>

        {/* Property Grid */}
        {loading ? (
          <p>Loading properties…</p>
        ) : (
          <div className="grid cards">
            {items.length === 0 && <p>No properties match your filters.</p>}
            {items.map(p => (
              <div key={p._id} className="card">
                <img
                  src={p.imageUrl || 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop'}
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
                    <button className="btn" onClick={() => handleBook(p._id)}>Book Now</button>
                    <Link className="btn secondary" to={`/property/${p._id}`}>Details</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="footer-space" />
      </div>
    </>
  );
}
