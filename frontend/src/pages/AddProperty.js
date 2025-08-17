import { useState, useEffect } from 'react';
import { createProperty } from '../services/propertyService';
import { useNavigate } from 'react-router-dom';

export default function AddProperty() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', location: '', rent: '', bedrooms: 1, description: '', image: ''
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('rn_user') || 'null');
    if (!u) setMsg('Tip: Login/register as landlord to attach your user to the listing.');
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const u = JSON.parse(localStorage.getItem('rn_user') || 'null');
      const landlordId = u?._id || null;
      await createProperty({ ...form, rent: Number(form.rent), bedrooms: Number(form.bedrooms), landlordId });
      navigate('/');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="container">
      <h2>Add Property</h2>
      <form onSubmit={submit} className="form">
        <input placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} required />
        <input placeholder="Location" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} required />
        <input type="number" placeholder="Rent" value={form.rent} onChange={e=>setForm({...form, rent:e.target.value})} required />
        <input type="number" placeholder="Bedrooms" value={form.bedrooms} onChange={e=>setForm({...form, bedrooms:e.target.value})} min="1" />
        <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <input placeholder="Image URL (optional)" value={form.image} onChange={e=>setForm({...form, image:e.target.value})} />
        <button type="submit">Create</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
