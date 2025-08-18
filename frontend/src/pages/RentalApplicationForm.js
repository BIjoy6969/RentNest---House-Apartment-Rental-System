import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applyRental } from "../services/applicationService";

export default function RentalApplicationForm() {
  const { id } = useParams(); // propertyId
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("rn_user") || "null");

  const [form, setForm] = useState({
    fullName: user?.name || "",
    email: user?.email || "",
    phone: "",
    occupation: "",
    monthlyIncome: "",
    message: "",
  });

  const ch = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await applyRental({
        propertyId: id,
        tenantId: user._id,
        ...form
      });
      alert("Application submitted!");
      navigate("/tenant");
    } catch {
      alert("Failed to submit application");
    }
  };

  return (
    <div className="container">
      <h2>Rental Application</h2>
      <form onSubmit={submit}>
        <input name="fullName" value={form.fullName} onChange={ch} placeholder="Full Name" required />
        <input name="email" value={form.email} onChange={ch} placeholder="Email" required />
        <input name="phone" value={form.phone} onChange={ch} placeholder="Phone" required />
        <input name="occupation" value={form.occupation} onChange={ch} placeholder="Occupation" />
        <input name="monthlyIncome" value={form.monthlyIncome} onChange={ch} placeholder="Monthly Income" />
        <textarea name="message" value={form.message} onChange={ch} placeholder="Message (optional)" />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
