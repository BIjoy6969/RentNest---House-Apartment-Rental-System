import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tenant");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // এখানে API call করবে backend এ register করার জন্য
    alert("Registered successfully!");
    navigate("/login");
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <div>
          <label>
            <input
              type="radio"
              value="tenant"
              checked={role === "tenant"}
              onChange={() => setRole("tenant")}
            />
            Tenant
          </label>
          <label>
            <input
              type="radio"
              value="landlord"
              checked={role === "landlord"}
              onChange={() => setRole("landlord")}
            />
            Landlord
          </label>
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
