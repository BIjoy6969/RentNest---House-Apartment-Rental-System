import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

function BookingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [note, setNote] = useState('');

  // Load property details
  useEffect(() => {
    api.get(`/properties/${id}`)
      .then(response => setProperty(response.data))
      .catch(error => console.log('Error loading property:', error));
  }, [id]);

  // Handle booking request
  const handleBooking = async () => {
    if (!scheduledAt) {
      alert('Please select a scheduled date for the viewing');
      return;
    }

    const data = { 
      property: id,  // the property ID for the booking
      scheduledAt,  // scheduled date
      note          // any optional note
    };

    try {
      await api.post('/bookings', data);
      alert('Booking Successful!');
      navigate('/tenant');  // Redirect to tenant dashboard
    } catch (error) {
      console.error('Error booking property:', error);
      alert('Failed to make booking. Please try again.');
    }
  };

  // Display a loading message while the property data is being fetched
  if (!property) return <div>Loading...</div>;

  return (
    <div className="container p-6">
      <h1 className="text-3xl font-bold mb-4">{property.title}</h1>
      <p>{property.description}</p>
      <p className="font-semibold text-lg">${property.rent}/month</p>
      
      <div>
        <label>Choose a date for the viewing</label>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
      </div>
      
      <div>
        <label>Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
      </div>
      
      <button onClick={handleBooking} className="bg-blue-600 text-white p-2 rounded">
        Book Viewing
      </button>
    </div>
  );
}

export default BookingPage;
