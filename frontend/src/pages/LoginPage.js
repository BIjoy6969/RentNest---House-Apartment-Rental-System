import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("tenant"); // default tenant
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // এখানে API call করবে backend এ login করার জন্য
    // ধরলাম response successful, আমরা localStorage তে save করবো
    const user = { name: "Demo User", email, role }; 
    localStorage.setItem("user", JSON.stringify(user));

    if (role === "tenant") navigate("/");
    else if (role === "landlord") navigate("/");
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
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
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
