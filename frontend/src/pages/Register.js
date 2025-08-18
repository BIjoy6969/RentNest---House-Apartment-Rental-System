import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "tenant" });
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await registerUser(form);
      navigate("/login");
    } catch (error) {
      setErr(error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="container" onSubmit={submit}>
      <h2>Create Account</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <form autoComplete="off">
        <input name="name" placeholder="Full Name" value={form.name} onChange={ch} required autoComplete="off" />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={ch} required autoComplete="off" />
        <div style={{ position: "relative" }}>
          <input
            type={showPass ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={ch}
            required
            autoComplete="new-password"
          />
          <span onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 10, top: 10, cursor: "pointer" }}>
            {showPass ? "🙈" : "👁"}
          </span>
        </div>
        <select name="role" value={form.role} onChange={ch}>
          <option value="tenant">Tenant</option>
          <option value="landlord">Landlord</option>
        </select>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
