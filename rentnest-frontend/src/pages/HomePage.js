import React, { useEffect, useState } from 'react';
import { api } from '../api';

function HomePage() {
  const [properties, setProperties] = useState([]);  // Initialize as an empty array
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch properties from the backend API
    api.get('/properties')
      .then((response) => {
        setProperties(response.data);  // Set the properties state with the data from the API
      })
      .catch((error) => {
        console.log('Error fetching properties:', error);
        setError('Could not load properties. Please try again later.');
      });
  }, []);

  if (error) {
    return <div>{error}</div>;  // Display error message if there was an issue fetching the properties
  }

  return (
    <div>
      <h1>Available Properties</h1>
      {/* Ensure properties is an array before calling .map() */}
      {properties.length === 0 ? (
        <p>No properties available at the moment.</p>
      ) : (
        properties.map((property) => (
          <div key={property._id} className="property-card">
            <h3>{property.title}</h3>
            <p>{property.description}</p>
            <p>{property.rent} per month</p>
            <p>{property.city}, {property.state}, {property.country}</p>
          </div>
        ))
      )}
    </div>
  );
}

export default HomePage;
