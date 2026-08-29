// src/components/tenant/TenantWishlist.jsx
import React from 'react';
import PropertyCard from '../property/PropertyCard';
import EmptyState from '../common/EmptyState';

export default function TenantWishlist({
  wishlist = [],
  loading = false,
  onToggleFavorite,
  onBookNow
}) {
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading saved properties…</div>;
  }

  if (wishlist.length === 0) {
    return (
      <EmptyState
        icon="❤️"
        title="No Saved Properties"
        description="Save properties you love by clicking the heart icon on any listing to easily compare and tour them later."
        actionText="Browse Properties"
        onAction={() => window.location.href = '/properties'}
      />
    );
  }

  return (
    <div className="property-grid">
      {wishlist.map((property) => (
        <PropertyCard
          key={property._id}
          property={property}
          isFavorite={true}
          onToggleFavorite={onToggleFavorite}
          onBookNow={onBookNow}
        />
      ))}
    </div>
  );
}
