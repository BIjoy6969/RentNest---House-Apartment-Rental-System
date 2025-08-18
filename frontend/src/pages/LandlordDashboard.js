import { useEffect, useState } from "react";
import { fetchProperties, deleteProperty } from "../services/propertyService";
import { Link } from "react-router-dom";

export default function LandlordDashboard() {
  const user = JSON.parse(localStorage.getItem("rn_user") || "null");
  const [list, setList] = useState([]);

  const load = async () => {
    const data = await fetchProperties();
    // landlordId সংরক্ষণ করা থাকলে এখানে filter করবে
    setList(data.filter(p => p.landlordId === user._id || !p.landlordId)); // fallback: show all if not attached
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    if (!window.confirm("Delete this property?")) return;
    await deleteProperty(id);
    load();
  };

  return (
    <div className="container">
      <h2>Landlord Dashboard</h2>
      <div style={{ marginBottom: 12 }}>
        <Link to="/landlord/add">+ Add Property</Link> | <Link to="/landlord/applications" style={{ marginLeft: 8 }}>View Applications</Link>
      </div>
      <div className="property-grid">
        {list.map(p => (
          <div key={p._id} className="property-card">
            {p.image ? <img src={p.image} alt={p.title} /> : <div style={{height:180, background:"#eee", borderRadius:8}}/>}
            <h3>{p.title}</h3>
            <p>{p.location}</p>
            <p>Rent: {p.rent} BDT</p>
            <div style={{ display: "flex", gap: 8 }}>
              <Link to={`/landlord/edit/${p._id}`}>Edit</Link>
              <button onClick={() => remove(p._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
