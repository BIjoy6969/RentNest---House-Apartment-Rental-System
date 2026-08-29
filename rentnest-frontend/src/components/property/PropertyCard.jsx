// src/components/property/PropertyCard.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import { getImageUrl, DEFAULT_FALLBACK } from '../../utils/imageUrl';

export default function PropertyCard({
  property,
  isFavorite = false,
  onToggleFavorite,
  onBookNow,
  favoriteLoading = false,
  showStatus = false,
  isComparing = false,
  onToggleCompare
}) {
  const nav = useNavigate();
  if (!property) return null;

  const {
    _id,
    title,
    city,
    state,
    rent,
    bedrooms = 1,
    bathrooms = 1,
    amenities = [],
    isActive = true,
    status = 'available',
    propertyType = 'apartment',
    completenessScore = 0
  } = property;

  const resolvedImg = property.primaryImage || property.imageUrl || (property.images && property.images[0]?.url);
  const displayImage = getImageUrl(resolvedImg);

  return (
    <div className="rn-card rn-card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Image Wrap */}
      <div className="prop-card-img-wrap">
        <img
          src={displayImage}
          alt={title}
          className="prop-card-img"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_FALLBACK;
          }}
        />

        {/* Status / Location Badge */}
        <div className="prop-card-badge">
          {status === 'rented' ? (
            <StatusBadge status="danger" label="Rented" />
          ) : status === 'reserved' ? (
            <StatusBadge status="warning" label="Reserved" />
          ) : showStatus ? (
            <StatusBadge status={isActive ? 'active' : 'inactive'} label={isActive ? 'Available' : 'Draft'} />
          ) : (
            <span
              style={{
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                backdropFilter: 'blur(4px)',
                color: '#ffffff',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              📍 {city || 'Dhaka'}
            </span>
          )}
        </div>

        {/* Property Type Badge Top-Left */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 2 }}>
          <span
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'var(--text-main)',
              fontSize: '0.7rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            {propertyType}
          </span>
        </div>

        {/* Wishlist Button */}
        {onToggleFavorite && (
          <button
            type="button"
            className={`prop-card-wish-btn ${isFavorite ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(_id);
            }}
            disabled={favoriteLoading}
            title={isFavorite ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-label="Wishlist toggle"
          >
            {isFavorite ? '❤️' : '🤍'}
          </button>
        )}
      </div>

      {/* Card Body */}
      <div className="prop-card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Price Row */}
        <div className="prop-card-price-row">
          <div className="prop-card-price">
            ৳{Number(rent || 0).toLocaleString()} <span>/ month</span>
          </div>
          {completenessScore >= 80 && (
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--success-text)',
                backgroundColor: 'var(--success-bg)',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700
              }}
              title="Verified quality listing details"
            >
              ✓ Verified
            </span>
          )}
        </div>

        {/* Title */}
        <Link to={`/property/${_id}`} style={{ textDecoration: 'none' }}>
          <h3 className="prop-card-title" title={title}>
            {title}
          </h3>
        </Link>

        {/* Location */}
        <div className="prop-card-location">
          <span>📍</span>
          <span>{[city, state].filter(Boolean).join(', ') || 'Available in city'}</span>
        </div>

        {/* Key Features */}
        <div className="prop-card-features">
          <span>🛏️ {bedrooms} {bedrooms === 1 ? 'Bed' : 'Beds'}</span>
          <span>🚿 {bathrooms} {bathrooms === 1 ? 'Bath' : 'Baths'}</span>
          {amenities && amenities.length > 0 && (
            <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: '0.8rem' }}>
              +{amenities.length} amenities
            </span>
          )}
        </div>

        {/* Compare & Actions */}
        <div style={{ marginTop: 'auto', paddingTop: '0.75rem' }}>
          {onToggleCompare && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
              <input
                type="checkbox"
                id={`compare-${_id}`}
                checked={isComparing}
                onChange={() => onToggleCompare(property)}
                style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
              />
              <label htmlFor={`compare-${_id}`} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                Compare listing
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            {onBookNow ? (
              <Button
                variant="primary"
                size="sm"
                style={{ flex: 1 }}
                onClick={() => onBookNow(_id)}
                disabled={status === 'rented'}
              >
                {status === 'rented' ? 'Rented' : 'Book Viewing'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                style={{ flex: 1 }}
                onClick={() => nav(`/property/${_id}?book=1`)}
                disabled={status === 'rented'}
              >
                {status === 'rented' ? 'Rented' : 'Book Viewing'}
              </Button>
            )}
            <Link to={`/property/${_id}`} style={{ flex: 1 }}>
              <Button variant="secondary" size="sm" style={{ width: '100%' }}>
                Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
