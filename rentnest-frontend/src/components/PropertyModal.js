// src/components/PropertyModal.js
import React from 'react';
import './PropertyModal.css';

export default function PropertyModal({ property, onClose, onBookNow }) {
  if (!property) return null;

  return (
    <div className="property-modal-overlay" onClick={onClose}>
      <div className="property-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>X</button>
        <div className="property-modal-content">
          <img
            src={property.imageUrl || 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop'}
            alt={property.title}
            className="property-image"
          />
          <div className="property-details">
            <h2>{property.title}</h2>
            <p><strong>Location:</strong> {property.city}, {property.state}</p>
            <p><strong>Rent:</strong> {property.rent} / month</p>
            <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
            <p><strong>Description:</strong> {property.description}</p>
          </div>
          <button className="btn book-now-btn" onClick={() => onBookNow(property._id)}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}
