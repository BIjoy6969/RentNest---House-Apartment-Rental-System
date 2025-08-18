import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function RentalApplicationPage() {
  const { propertyId } = useParams();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // API call to submit application
    alert("Application submitted!");
    navigate("/");
  };

  return (
    <div>
      <h2>Rental Application Form</h2>
      <p>Applying for Property ID: {propertyId}</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <textarea
          placeholder="Additional Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit">Submit Application</button>
      </form>
    </div>
  );
}
