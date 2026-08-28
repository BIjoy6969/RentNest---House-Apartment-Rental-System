import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';

function PropertyPage() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);

  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(response => setProperty(response.data))
      .catch(error => console.log(error));
  }, [id]);

  if (!property) return <div>Loading...</div>;

  return (
    <div className="container p-6">
      <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
      <p>{property.description}</p>
      <p className="font-semibold text-lg">${property.rent}/month</p>
      <p>{property.address}</p>
      <button className="bg-blue-600 text-white p-2 rounded mt-4">Book a Viewing</button>
    </div>
  );
}

export default PropertyPage;
