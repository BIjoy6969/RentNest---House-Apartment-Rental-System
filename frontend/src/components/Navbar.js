import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("rn_user") || "null");

  const logout = () => {
    localStorage.removeItem("rn_user");
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brand} onClick={() => navigate(user?.role === "landlord" ? "/landlord" : user?.role === "tenant" ? "/tenant" : "/")}>
        RentNest
      </div>

      {!user ? (
        <div style={styles.links}>
          <Link to="/login" style={styles.link}>Login</Link>
          <Link to="/register" style={styles.link}>Register</Link>
        </div>
      ) : (
        <div style={styles.links}>
          <span style={{ marginRight: 12 }}>Hi, {user.name} ({user.role})</span>
          {user.role === "tenant" && <Link to="/tenant" style={styles.link}>Tenant</Link>}
          {user.role === "landlord" && <Link to="/landlord" style={styles.link}>Landlord</Link>}
          <button onClick={logout} style={styles.btn}>Logout</button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: { height: 60, padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f7f7f7", borderBottom: "1px solid #eee" },
  brand: { fontSize: 20, fontWeight: 700, cursor: "pointer" },
  links: { display: "flex", alignItems: "center", gap: 12 },
  link: { textDecoration: "none" },
  btn: { padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer" },
};
