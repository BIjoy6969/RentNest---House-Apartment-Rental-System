import React, { useEffect, useState } from "react";
import { fetchProperties } from "../services/propertyService";
import "./PropertyList.css"; // Make sure this file exists

const PropertyList = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await fetchProperties();
        setProperties(data);
      } catch (err) {
        setError("Failed to fetch properties");
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  if (loading) return <p>Loading properties...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="property-list">
      <h2>Available Properties</h2>
      <div className="property-grid">
        {properties.map((property) => (
          <div key={property._id} className="property-card">
            <img src={property.image} alt={property.title} />
            <h3>{property.title}</h3>
            <p>{property.location}</p>
            <p>Rent: {property.rent} BDT</p>
            <p>Bedrooms: {property.bedrooms}</p>
            <p>{property.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyList;
