import { useState, useEffect } from 'react';
import { fetchPropertyById, updateProperty, deleteProperty } from '../services/propertyService';
import { useParams, useNavigate } from 'react-router-dom';

export default function EditProperty() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchPropertyById(id);
        setForm({ ...data, rent: String(data.rent), bedrooms: String(data.bedrooms) });
      } catch (err) {
        setMsg('Failed to load property');
      }
    })();
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('rn_user') || 'null');
      const landlordId = user?._id || null;
      await updateProperty(id, { ...form, rent: Number(form.rent), bedrooms: Number(form.bedrooms), landlordId });
      navigate(`/property/${id}`);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Update failed');
    }
  };

  const remove = async () => {
    if (!window.confirm('Delete this property?')) return;
    try {
      const user = JSON.parse(localStorage.getItem('rn_user') || 'null');
      const landlordId = user?._id || null;
      await deleteProperty(id, { landlordId });
      navigate('/');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Delete failed');
    }
  };

  if (!form) return <div>Loading...</div>;

  return (
    <div className="container">
      <h2>Edit Property</h2>
      <form onSubmit={submit}>
        <input value={form.title} onChange={e=>setForm({...form, title:e.target.value})} />
        <input value={form.location} onChange={e=>setForm({...form, location:e.target.value})} />
        <input type="number" value={form.rent} onChange={e=>setForm({...form, rent:e.target.value})} />
        <input type="number" value={form.bedrooms} onChange={e=>setForm({...form, bedrooms:e.target.value})} />
        <textarea value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        <input value={form.image} onChange={e=>setForm({...form, image:e.target.value})} />
        <button type="submit">Save</button>
        <button type="button" onClick={remove}>Delete</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
