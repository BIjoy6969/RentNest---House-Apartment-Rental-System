import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function EditPropertyPage() {
  const { propertyId } = useParams();
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [rent, setRent] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch property by ID and populate
    // API call placeholder
    setTitle("Sample Property");
    setLocation("Sample Location");
    setRent("1000");
  }, [propertyId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // API call to update property
    alert("Property updated!");
    navigate("/");
  };

  return (
    <div>
      <h2>Edit Property</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Rent"
          value={rent}
          onChange={(e) => setRent(e.target.value)}
          required
        />
        <button type="submit">Update Property</button>
      </form>
    </div>
  );
}
