// src/pages/LandingPage.js
import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../context/ToastContext';
import PropertyCard from '../components/property/PropertyCard';
import PropertyFilters from '../components/property/PropertyFilters';
import { SkeletonPropertyCard } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import BookingModal from '../components/booking/BookingModal';
import Button from '../components/common/Button';

export default function LandingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  const [properties, setProperties] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});

  // Booking Modal
  const [selectedPropForBooking, setSelectedPropForBooking] = useState(null);

  const loadProperties = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const res = await api.get('/properties', { params });
      const list = res.data?.properties ? res.data.properties : (Array.isArray(res.data) ? res.data : []);
      setProperties(list);
    } catch (e) {
      console.error(e);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    if (!user || user.role !== 'tenant') return;
    try {
      const res = await api.get('/favorites/mine');
      const ids = new Set((res.data || []).map((item) => (typeof item === 'string' ? item : item._id)));
      setWishlistIds(ids);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    loadProperties(filters);
  }, [loadProperties, filters]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleToggleFavorite = async (propertyId) => {
    if (!user) {
      toast.info('Please sign in to save properties to your wishlist');
      nav('/login');
      return;
    }
    if (user.role !== 'tenant') {
      toast.info('Wishlist is available for tenants');
      return;
    }

    const isFav = wishlistIds.has(propertyId);
    try {
      if (isFav) {
        await api.delete(`/favorites/${propertyId}`);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
        toast.info('Removed from saved properties');
      } else {
        await api.post(`/favorites/${propertyId}`);
        setWishlistIds((prev) => new Set([...prev, propertyId]));
        toast.success('Added to saved properties');
      }
    } catch {
      toast.error('Could not update saved properties');
    }
  };

  const handleBookNow = (propertyId) => {
    if (!user) {
      toast.info('Please sign in to schedule a viewing');
      nav('/login', { state: { next: `/property/${propertyId}?book=1` } });
      return;
    }
    const prop = properties.find((p) => p._id === propertyId);
    if (prop) setSelectedPropForBooking(prop);
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
          color: '#ffffff',
          padding: '4.5rem 0 3.5rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none'
          }}
        />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center', marginBottom: '2.5rem' }}>
            <span
              style={{
                display: 'inline-block',
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                backdropFilter: 'blur(6px)',
                padding: '0.35rem 1rem',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.25rem',
                letterSpacing: '0.04em'
              }}
            >
              ✨ VERIFIED RENTAL MARKETPLACE
            </span>
            <h1
              style={{
                fontSize: 'clamp(2.25rem, 5vw, 3.5rem)',
                color: '#ffffff',
                lineHeight: 1.15,
                marginBottom: '1.25rem'
              }}
            >
              Find a place you’ll love to live.
            </h1>
            <p style={{ fontSize: '1.15rem', color: '#dbeafe', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
              Explore verified apartments and houses, schedule direct viewings with trusted landlords, and apply online with zero hassle.
            </p>
          </div>

          {/* Search Card in Hero */}
          <div style={{ maxWidth: '880px', margin: '0 auto' }}>
            <PropertyFilters
              compact={true}
              initial={filters}
              onApply={(f) => setFilters(f)}
            />
          </div>
        </div>
      </section>

      {/* Featured Properties Grid */}
      <section className="container section-py">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div>
            <span className="section-kicker">Browse Listings</span>
            <h2>Featured Properties</h2>
            <p className="section-subtitle">
              Handpicked residences with transparent pricing and direct landlord contact.
            </p>
          </div>
          <Link to="/properties">
            <Button variant="outline">View All Rentals →</Button>
          </Link>
        </div>

        {loading ? (
          <div className="property-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonPropertyCard key={i} />
            ))}
          </div>
        ) : properties.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No matching properties"
            description="Try changing your search keywords, city, or rent range."
            actionText="Clear Filters"
            onAction={() => setFilters({})}
          />
        ) : (
          <div className="property-grid">
            {properties.map((p) => (
              <PropertyCard
                key={p._id}
                property={p}
                isFavorite={wishlistIds.has(p._id)}
                onToggleFavorite={handleToggleFavorite}
                onBookNow={handleBookNow}
              />
            ))}
          </div>
        )}
      </section>

      {/* Why RentNest Section */}
      <section id="why-us" style={{ backgroundColor: '#ffffff', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container section-py">
          <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem' }}>
            <span className="section-kicker">Why RentNest</span>
            <h2>A Better Way to Rent</h2>
            <p className="section-subtitle" style={{ margin: '0.5rem auto 0' }}>
              We simplify the rental lifecycle for both tenants and landlords with speed, security, and clarity.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
            <div className="rn-card" style={{ padding: '2rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🛡️</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Verified Listings</h4>
              <p style={{ fontSize: '0.925rem', lineHeight: 1.6 }}>
                Every property is screened to eliminate scam listings, false addresses, and misleading prices.
              </p>
            </div>

            <div className="rn-card" style={{ padding: '2rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Instant Viewing Booking</h4>
              <p style={{ fontSize: '0.925rem', lineHeight: 1.6 }}>
                Pick your preferred date and time directly through our scheduling system without endless phone tags.
              </p>
            </div>

            <div className="rn-card" style={{ padding: '2rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💬</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Direct In-App Chat</h4>
              <p style={{ fontSize: '0.925rem', lineHeight: 1.6 }}>
                Ask questions, clarify lease terms, and coordinate viewing details safely within the platform.
              </p>
            </div>

            <div className="rn-card" style={{ padding: '2rem', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📝</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Digital Applications</h4>
              <p style={{ fontSize: '0.925rem', lineHeight: 1.6 }}>
                Submit structured rental applications with automated screening scores and live status tracking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="container section-py">
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem' }}>
          <span className="section-kicker">Simple Steps</span>
          <h2>How It Works</h2>
          <p className="section-subtitle" style={{ margin: '0.5rem auto 0' }}>
            Whether you are renting your next home or listing your apartment, we make it effortless.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 800,
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}
            >
              1
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>Discover & Filter</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Search across cities, adjust rent limits, and inspect bedroom counts and amenities.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 800,
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}
            >
              2
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>Book a Tour</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Choose a viewing schedule and receive landlord confirmation directly on your dashboard.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                fontWeight: 800,
                fontSize: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}
            >
              3
            </div>
            <h4 style={{ marginBottom: '0.5rem' }}>Apply & Move In</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Complete the verified online application form and get approved without paper bureaucracy.
            </p>
          </div>
        </div>
      </section>

      {/* Conversion Banner CTA */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '4rem 0'
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: '700px' }}>
          <h2 style={{ color: '#ffffff', marginBottom: '1rem' }}>Are you a property owner or landlord?</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: '2rem', lineHeight: 1.6 }}>
            List your properties on RentNest to find reliable, verified tenants quickly. Manage viewings, screening, and leases in one powerful portal.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register">
              <Button variant="primary" size="lg">
                List Your Property
              </Button>
            </Link>
            <Link to="/properties">
              <Button variant="secondary" size="lg">
                Browse Properties
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {selectedPropForBooking && (
        <BookingModal
          isOpen={!!selectedPropForBooking}
          property={selectedPropForBooking}
          onClose={() => setSelectedPropForBooking(null)}
          onSuccess={() => loadWishlist()}
        />
      )}
    </div>
  );
}
