import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchProperties } from "../services/propertyService";

export default function LandingPage() {
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user from localStorage
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);

    // Fetch properties
    const getProperties = async () => {
      try {
        const data = await fetchProperties();
        setProperties(data);
      } catch (error) {
        console.error("Error fetching properties:", error);
      }
    };

    getProperties();
  }, []);

  // Filter properties based on search
  const filteredProperties = properties.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  // Handle Book Now
  const handleBook = (propertyId) => {
    if (!user) {
      alert("Please login first to book a property");
      navigate("/login");
    } else if (user.role === "tenant") {
      navigate(`/rental-application/${propertyId}`);
    }
  };

  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>RentNest</h1>
        <div>
          {!user ? (
            <>
              <Link to="/login">Login</Link> |{" "}
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              <span>Welcome, {user.name}</span>{" "}
              <button
                onClick={() => {
                  localStorage.removeItem("user");
                  setUser(null);
                  navigate("/");
                }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <hr />

      <div>
        <input
          type="text"
          placeholder="Search properties..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", marginTop: "20px" }}>
        {filteredProperties.length > 0 ? (
          filteredProperties.map((property) => (
            <div
              key={property._id}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                margin: "10px",
                width: "250px",
              }}
            >
              <h3>{property.title}</h3>
              <p>{property.location}</p>
              <p>Rent: ${property.rent}</p>

              {user && user.role === "landlord" ? (
                <div>
                  <button onClick={() => navigate(`/edit-property/${property._id}`)}>
                    Edit
                  </button>{" "}
                  <button onClick={() => navigate(`/delete-property/${property._id}`)}>
                    Delete
                  </button>
                </div>
              ) : (
                <button onClick={() => handleBook(property._id)}>Book Now</button>
              )}
            </div>
          ))
        ) : (
          <p>No properties found.</p>
        )}
      </div>
    </div>
  );
}
