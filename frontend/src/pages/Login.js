import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      const data = await loginUser(form);
      localStorage.setItem("rn_user", JSON.stringify(data));
      if (data.role === "tenant") navigate("/tenant");
      else if (data.role === "landlord") navigate("/landlord");
      else navigate("/");
    } catch (error) {
      setErr(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
      <form onSubmit={submit} autoComplete="off">
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={ch} required autoComplete="username" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={ch} required autoComplete="current-password" />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
