import React from 'react';
import { Link } from 'react-router-dom';

function PropertyCard({ property }) {
  return (
    <div className="property-card">
      <img src={property.image} alt={property.title} className="w-full h-48 object-cover" />
      <div className="details">
        <h3>{property.title}</h3>
        <p>{property.city}</p>
        <p className="price">${property.rent}/month</p>
        <Link to={`/property/${property._id}`}>
          <button>View Details</button>
        </Link>
      </div>
    </div>
  );
}

export default PropertyCard;
