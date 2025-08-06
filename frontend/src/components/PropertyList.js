import React, { useEffect, useState } from 'react';
import { getProperties } from '../services/propertyService';
import '../styles/PropertyList.css';

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [location, setLocation] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);

  const fetchProperties = async () => {
    const data = await getProperties({ location, minRent, maxRent });
    setProperties(data);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  return (
    <div className="container">
      <h2 className="title">🏡 Available Properties</h2>

      {/* Search & Filter */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min Rent"
          value={minRent}
          onChange={(e) => setMinRent(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max Rent"
          value={maxRent}
          onChange={(e) => setMaxRent(e.target.value)}
        />
        <button onClick={fetchProperties}>Search</button>
      </div>

      {/* Property Cards */}
      <div className="property-grid">
        {properties.length > 0 ? (
          properties.map((property) => (
            <div
              key={property._id}
              className="property-card"
              onClick={() => setSelectedProperty(property)}
            >
              <img src={property.image} alt={property.title} />
              <div className="card-body">
                <h3>{property.title}</h3>
                <p>{property.location}</p>
                <p><strong>Rent:</strong> {property.rent} BDT</p>
                <p><strong>Bedrooms:</strong> {property.bedrooms}</p>
              </div>
            </div>
          ))
        ) : (
          <p>No properties found.</p>
        )}
      </div>

      {/* Modal */}
      {selectedProperty && (
        <div className="modal-overlay" onClick={() => setSelectedProperty(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setSelectedProperty(null)}>&times;</span>
            <img src={selectedProperty.image} alt={selectedProperty.title} />
            <h2>{selectedProperty.title}</h2>
            <p><strong>Location:</strong> {selectedProperty.location}</p>
            <p><strong>Rent:</strong> {selectedProperty.rent} BDT</p>
            <p><strong>Bedrooms:</strong> {selectedProperty.bedrooms}</p>
            <p>{selectedProperty.description}</p>
            <button className="book-btn">Book Now</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyList;
