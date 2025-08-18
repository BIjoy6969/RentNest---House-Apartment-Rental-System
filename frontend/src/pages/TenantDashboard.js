import { useEffect, useState } from "react";
import { fetchProperties } from "../services/propertyService";
import { Link } from "react-router-dom";

export default function TenantDashboard() {
  const [list, setList] = useState([]);
  const [all, setAll] = useState([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProperties();
        setList(data);
        setAll(data);
      } catch (e) {
        console.error("Failed to load properties");
      }
    })();
  }, []);

  const search = (e) => {
    e && e.preventDefault();
    const t = q.trim().toLowerCase();
    setList(!t ? all : all.filter(p =>
      (p.title || "").toLowerCase().includes(t) ||
      (p.location || "").toLowerCase().includes(t)
    ));
  };

  return (
    <div className="container">
      <h2>Available Properties</h2>
      <form onSubmit={search} style={{ marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search..." />
        <button type="submit" style={{ marginLeft: 8 }}>Search</button>
        <button type="button" style={{ marginLeft: 8 }} onClick={() => { setQ(""); setList(all); }}>Reset</button>
      </form>

      <div className="property-grid">
        {list.map(p => (
          <div key={p._id} className="property-card">
            {p.image ? <img src={p.image} alt={p.title} /> : <div style={{height:180,background:"#eee",borderRadius:8}} />}
            <h3>{p.title}</h3>
            <p>{p.location}</p>
            <p>Rent: {p.rent} BDT</p>
            <Link to={`/tenant/property/${p._id}`}>Details & Book</Link>
          </div>
        ))}
      </div>
    </div>
  );
}
