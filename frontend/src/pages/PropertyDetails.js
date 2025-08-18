import { useEffect, useState } from "react";
import { fetchPropertyById } from "../services/propertyService";
import { useParams, Link, useNavigate } from "react-router-dom";

export default function PropertyDetails() {
  const { id } = useParams();
  const [prop, setProp] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPropertyById(id);
        setProp(data);
      } catch {
        // ignore
      }
    })();
  }, [id]);

  if (!prop) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h2>{prop.title}</h2>
      {prop.image && <img src={prop.image} alt={prop.title} style={{ maxWidth: 600, width: "100%", borderRadius: 12 }} />}
      <p><b>Location:</b> {prop.location}</p>
      <p><b>Rent:</b> {prop.rent} BDT</p>
      <p><b>Bedrooms:</b> {prop.bedrooms}</p>
      <p>{prop.description}</p>
      <button onClick={() => navigate(`/tenant/property/${prop._id}/apply`)}>Book Now</button>
      <Link to="/tenant" style={{ marginLeft: 8 }}>Back</Link>
    </div>
  );
}
