import { useAuth } from '../AuthContext';
import { useEffect, useState } from 'react';
import { api } from '../api';

export default function LandlordDashboard() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: '', description: '', address: '', city: '', state: '', country: '',
    rent: '', bedrooms: 1, bathrooms: 1, amenities: '', image: null
  });
  const [saving, setSaving] = useState(false);
  const [mine, setMine] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [chat, setChat] = useState({ propertyId: '', withUserId: '', message: '', thread: [] });

  // ----- Loaders -----
  const loadMine = async () => {
    const res = await api.get('/properties/mine/list');
    setMine(res.data || []);
  };

  const loadIncoming = async () => {
    const res = await api.get('/bookings/incoming');
    setIncoming(res.data || []);
  };

  useEffect(() => {
    if (!user) return;
    loadMine();
    loadIncoming();
  }, [user]);

  // ----- Form handlers -----
  const onChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // Handle Image Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prevForm => ({ ...prevForm, image: file }));
    }
  };

  const createProperty = async (e) => {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('rent', form.rent);
    formData.append('address', form.address);
    formData.append('city', form.city);
    formData.append('state', form.state);
    formData.append('country', form.country);
    formData.append('bedrooms', form.bedrooms);
    formData.append('bathrooms', form.bathrooms);
    formData.append('amenities', form.amenities);
    formData.append('description', form.description);
    if (form.image) formData.append('image', form.image); // Handling image upload here

    try {
      await api.post('/properties/create', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({
        title: '', description: '', address: '', city: '', state: '', country: '',
        rent: '', bedrooms: 1, bathrooms: 1, amenities: '', image: null
      });
      await loadMine();
      alert('Property created.');
    } catch (error) {
      console.error("Error during property creation:", error);
      alert('Failed to create property.');
    } finally {
      setSaving(false);
    }
  };

  const updateProperty = async (p) => {
    const title = prompt('New title', p.title);
    if (title == null) return;
    await api.put(`/properties/${p._id}`, { title });
    await loadMine();
  };

  const deleteProperty = async (p) => {
    if (!window.confirm('Delete this property?')) return;
    await api.delete(`/properties/${p._id}`);
    await loadMine();
  };

  const setStatus = async (b, status) => {
    await api.patch(`/bookings/${b._id}/status`, { status });
    await loadIncoming();
    alert(`Marked ${status}`);
  };

  const openThread = async (propertyId, tenantId) => {
    const res = await api.get('/messages/thread', { params: { propertyId, withUserId: tenantId } });
    setChat({ propertyId, withUserId: tenantId, message: '', thread: res.data || [] });
  };

  const sendMessage = async () => {
    if (!chat.message.trim()) return;
    const res = await api.post('/messages', {
      propertyId: chat.propertyId,
      receiverId: chat.withUserId,
      content: chat.message
    });
    setChat(c => ({ ...c, message: '', thread: [...c.thread, res.data] }));
  };

  if (!user) return <div className="container">Please log in first.</div>;
  if (user.role !== 'landlord') return <div className="container">Forbidden: Landlord access only.</div>;

  return (
    <div className="container">
      <h2 style={{ margin: '18px 0' }}>Landlord Dashboard</h2>
      <p>Welcome, {user?.name || 'landlord'}.</p>

      {/* Create property */}
      <h3 style={{ margin: '14px 0' }}>Add a property</h3>
      <form className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 14 }} onSubmit={createProperty}>
        <input className="input" placeholder="Title" name="title" value={form.title} onChange={onChange} />
        <input className="input" placeholder="Rent" name="rent" value={form.rent} onChange={onChange} />
        <input className="input" placeholder="Address" name="address" value={form.address} onChange={onChange} />
        <input className="input" placeholder="City" name="city" value={form.city} onChange={onChange} />
        <input className="input" placeholder="State" name="state" value={form.state} onChange={onChange} />
        <input className="input" placeholder="Country" name="country" value={form.country} onChange={onChange} />
        <input className="input" placeholder="Bedrooms" name="bedrooms" value={form.bedrooms} onChange={onChange} />
        <input className="input" placeholder="Bathrooms" name="bathrooms" value={form.bathrooms} onChange={onChange} />
        <input className="input" type="file" onChange={handleFileChange} />
        <input className="input" placeholder="Amenities (comma separated)" name="amenities" value={form.amenities} onChange={onChange} style={{ gridColumn: '1/-1' }} />
        <textarea className="input" placeholder="Description" name="description" value={form.description} onChange={onChange} style={{ gridColumn: '1/-1', height: 100 }} />
        <button className="btn" disabled={saving} style={{ gridColumn: '1/-1' }}>{saving ? 'Saving…' : 'Create Property'}</button>
      </form>

      {/* My properties */}
      <h3 style={{ margin: '18px 0' }}>My Properties</h3>
      <div className="grid cards">
        {mine.length === 0 && <p>No properties yet.</p>}
        {mine.map(p => (
          <div className="card" key={p._id}>
            <div className="card-body">
              <div className="card-title">{p.title}</div>
              <div className="card-meta">{p.city}, {p.state}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn secondary" onClick={() => updateProperty(p)}>Edit title</button>
                <button className="btn" onClick={() => deleteProperty(p)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Incoming bookings */}
      <h3 style={{ margin: '18px 0' }}>Incoming Booking Requests</h3>
      <div className="grid cards">
        {incoming.length === 0 && <p>No booking requests yet.</p>}
        {incoming.map(b => (
          <div className="card" key={b._id}>
            <div className="card-body">
              <div className="card-title">{b.property?.title}</div>
              <div className="card-meta">Tenant: {b.tenant?.name} • {b.tenant?.email}</div>
              <div className="card-meta">Viewing: {new Date(b.scheduledAt).toLocaleString()}</div>
              <div className="card-meta">Status: <b>{b.status}</b></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="btn" onClick={() => setStatus(b, 'approved')}>Approve</button>
                <button className="btn secondary" onClick={() => setStatus(b, 'rejected')}>Reject</button>
                <button className="btn secondary" onClick={() => openThread(b.property._id, b.tenant._id)}>Message</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Messaging */}
      {chat.propertyId && (
        <div style={{ marginTop: 18 }}>
          <h3>Messages</h3>
          <div className="card" style={{ padding: 12 }}>
            <div style={{ maxHeight: 220, overflow: 'auto', marginBottom: 10 }}>
              {chat.thread.map(m => (
                <div key={m._id} style={{ margin: '6px 0' }}>
                  <b>{String(m.sender) === user._id ? 'Me' : 'Tenant'}:</b> {m.content}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input"
                placeholder="Type a message"
                value={chat.message}
                onChange={e => setChat(c => ({ ...c, message: e.target.value }))}
              />
              <button className="btn" onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
