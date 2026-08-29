// src/pages/PropertyDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';
import StatusBadge from '../components/common/StatusBadge';
import ImageGallery from '../components/property/ImageGallery';
import BookingModal from '../components/booking/BookingModal';
import ApplicationModal from '../components/application/ApplicationModal';
import ChatBox from '../components/messaging/ChatBox';
import ReportPropertyModal from '../components/property/ReportPropertyModal';

export default function PropertyDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Modals
  const [bookingOpen, setBookingOpen] = useState(false);
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/properties/${id}`)
      .then((res) => {
        setProperty(res.data);
      })
      .catch((err) => {
        console.error(err);
        setProperty(null);
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Check wishlist state for tenants
  useEffect(() => {
    if (!user || user.role !== 'tenant') return;
    api.get('/favorites/mine')
      .then((res) => {
        const favs = res.data || [];
        const found = favs.some((item) => (typeof item === 'string' ? item === id : item._id === id));
        setIsFavorite(found);
      })
      .catch(() => {});
  }, [user, id]);

  // Auto-open booking modal if query parameter ?book=1 is present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('book') === '1' && property) {
      if (user && property.owner && String(property.owner._id || property.owner) === String(user._id || user.id)) {
        toast.info('You cannot book a viewing for your own listing');
      } else {
        setBookingOpen(true);
      }
    }
  }, [location.search, property, user, toast]);

  const isOwner = user && property && property.owner && (
    String(property.owner._id || property.owner) === String(user._id || user.id)
  );

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.info('Please sign in to save properties');
      nav('/login', { state: { next: `/property/${id}` } });
      return;
    }
    if (isOwner) {
      toast.info('You cannot save your own listing to wishlist');
      return;
    }
    if (user.role !== 'tenant') {
      toast.info('Wishlist is available for tenants');
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/favorites/${id}`);
        setIsFavorite(false);
        toast.info('Removed from saved properties');
      } else {
        await api.post(`/favorites/${id}`);
        setIsFavorite(true);
        toast.success('Saved to wishlist');
      }
    } catch {
      toast.error('Could not update saved properties');
    }
  };

  const handleOpenBooking = () => {
    if (!user) {
      toast.info('Please sign in to book a viewing');
      nav('/login', { state: { next: `/property/${id}?book=1` } });
      return;
    }
    if (isOwner) {
      toast.info('You cannot book a viewing for your own listing');
      return;
    }
    if (property.status === 'rented') {
      toast.info('This property has already been rented');
      return;
    }
    setBookingOpen(true);
  };

  const handleOpenApplication = () => {
    if (!user) {
      toast.info('Please sign in to submit a rental application');
      nav('/login', { state: { next: `/property/${id}` } });
      return;
    }
    if (isOwner) {
      toast.info('You cannot submit an application for your own listing');
      return;
    }
    if (property.status === 'rented') {
      toast.info('This property has already been rented');
      return;
    }
    setApplicationOpen(true);
  };

  const handleOpenChat = () => {
    if (!user) {
      toast.info('Please sign in to message the landlord');
      nav('/login', { state: { next: `/property/${id}` } });
      return;
    }
    if (isOwner) {
      toast.info('You are the landlord of this listing');
      return;
    }
    setChatOpen(true);
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <div style={{ width: '100%', height: '400px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xl)', marginBottom: '2rem' }} />
        <div style={{ height: '32px', width: '60%', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }} />
        <div style={{ height: '20px', width: '40%', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="container" style={{ padding: '5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.75rem' }}>Listing Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
          This property listing is no longer active or may have been removed by the landlord.
        </p>
        <Link to="/properties">
          <Button variant="primary">Browse Available Properties</Button>
        </Link>
      </div>
    );
  }

  const landlord = property.owner || {};

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Top Breadcrumb / Back */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          onClick={() => nav(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: 'var(--text-secondary)'
          }}
        >
          ← Back to listings
        </button>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {property.status === 'rented' ? (
            <StatusBadge status="danger" label="Currently Rented" />
          ) : property.status === 'reserved' ? (
            <StatusBadge status="warning" label="Application Pending / Reserved" />
          ) : (
            <StatusBadge status="active" label="Available for Rent" />
          )}

          {property.completenessScore >= 80 && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success-text)',
                padding: '0.2rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              ✓ Verified Quality
            </span>
          )}
        </div>
      </div>

      {/* Owner Notice Banner */}
      {isOwner && (
        <div
          style={{
            backgroundColor: 'var(--info-bg)',
            color: 'var(--info-text)',
            border: '1px solid var(--info-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div>
            <b>👑 You own this property listing.</b> Manage viewing requests, applications, and photos from your Landlord Dashboard.
          </div>
          <Link to="/landlord">
            <Button variant="primary" size="sm">Go to Dashboard</Button>
          </Link>
        </div>
      )}

      {/* Interactive Multi-Image Gallery */}
      <ImageGallery
        images={property.images}
        title={property.title}
        initialImageUrl={property.imageUrl}
      />

      {/* Grid: Details Left + Sticky Action Box Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: '2.5rem',
          alignItems: 'start'
        }}
        className="details-layout"
      >
        {/* Left Column: Details */}
        <div>
          <div style={{ marginBottom: '1.5rem' }}>
            <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
              {property.title}
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>📍</span>
              <span>{[property.address, property.city, property.state, property.country].filter(Boolean).join(', ')}</span>
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '1rem',
              padding: '1.25rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '2rem'
            }}
          >
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Monthly Rent
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                ৳{Number(property.rent).toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Bedrooms
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {property.bedrooms} {property.bedrooms === 1 ? 'Bed' : 'Beds'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Bathrooms
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {property.bathrooms} {property.bathrooms === 1 ? 'Bath' : 'Baths'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Property Type
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'capitalize' }}>
                {property.propertyType || 'Apartment'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.75rem' }}>About This Home</h3>
            <div
              style={{
                fontSize: '1rem',
                lineHeight: 1.7,
                color: 'var(--text-main)',
                whiteSpace: 'pre-line'
              }}
            >
              {property.description}
            </div>
          </div>

          {/* Amenities & Features */}
          {property.amenities && property.amenities.length > 0 && (
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>Amenities & Features</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                {property.amenities.map((item, idx) => (
                  <span
                    key={idx}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <span>✓</span> {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Landlord Contact Card */}
          <div
            style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '2rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem',
                  fontWeight: 700
                }}
              >
                {(landlord.name || 'L').charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                  Listed by {landlord.name || 'Verified Landlord'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Verified Property Owner • Direct Inquiries
                </div>
              </div>
            </div>

            {!isOwner && (
              <Button variant="secondary" onClick={handleOpenChat}>
                💬 Message Landlord
              </Button>
            )}
          </div>

          {/* Report Listing Trigger */}
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button
              type="button"
              onClick={() => setReportOpen(true)}
              style={{
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer'
              }}
            >
              🚩 Report suspicious listing or incorrect info
            </button>
          </div>
        </div>

        {/* Right Column: Sticky Action Box */}
        <div
          style={{
            position: 'sticky',
            top: '90px',
            padding: '1.75rem',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1.25rem' }}>
            <div>
              <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
                ৳{Number(property.rent).toLocaleString()}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}> / month</span>
            </div>
            <button
              type="button"
              onClick={handleToggleFavorite}
              disabled={isOwner}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: isOwner ? 'not-allowed' : 'pointer',
                opacity: isOwner ? 0.3 : 1
              }}
              title={isOwner ? 'Cannot favorite own listing' : isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleOpenBooking}
              disabled={isOwner || property.status === 'rented'}
            >
              📅 Request a Tour Viewing
            </Button>

            <Button
              variant="secondary"
              size="lg"
              fullWidth
              onClick={handleOpenApplication}
              disabled={isOwner || property.status === 'rented'}
            >
              📝 Submit Rental Application
            </Button>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span>⚡</span> <b>Zero booking fees</b> for tenants
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <span>🔒</span> <b>Secure direct messaging</b> with the verified owner
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🛡️</span> <b>Screening report</b> shared securely
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BookingModal
        isOpen={bookingOpen}
        onClose={() => setBookingOpen(false)}
        property={property}
        onSuccess={() => {
          setBookingOpen(false);
          toast.success('Tour request submitted! The landlord will review your request.');
        }}
      />

      <ApplicationModal
        isOpen={applicationOpen}
        onClose={() => setApplicationOpen(false)}
        property={property}
        onSuccess={() => {
          setApplicationOpen(false);
          toast.success('Rental application submitted successfully!');
        }}
      />

      <ChatBox
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        property={property}
        receiver={property.owner}
      />

      <ReportPropertyModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        propertyId={property._id}
        propertyTitle={property.title}
      />
    </div>
  );
}
