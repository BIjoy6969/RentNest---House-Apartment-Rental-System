// src/pages/AdminPanel.js
import { useEffect, useState } from 'react';
import { api } from '../api';

function Section({ title, children }) {
  return (
    <div style={{margin:'18px 0'}}>
      <h3 style={{marginBottom:10}}>{title}</h3>
      {children}
    </div>
  );
}

export default function AdminPanel() {
  const [tab, setTab] = useState('users'); // users | properties | complaints
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [props, setProps] = useState([]);
  const [complaints, setComplaints] = useState([]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } finally { setLoading(false); }
  };
  const loadProps = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/properties');
      setProps(res.data || []);
    } finally { setLoading(false); }
  };
  const loadComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/complaints');
      setComplaints(res.data || []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (tab === 'users') loadUsers();
    if (tab === 'properties') loadProps();
    if (tab === 'complaints') loadComplaints();
    // eslint-disable-next-line
  }, [tab]);

  /* Users actions */
  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    await api.delete(`/admin/users/${id}`);
    await loadUsers();
  };
  const changeRole = async (u) => {
    const newRole = prompt('Enter role (tenant / landlord / admin):', u.role);
    if (!newRole) return;
    const name = prompt('Enter name:', u.name);
    if (!name) return;
    const email = prompt('Enter email:', u.email);
    if (!email) return;
    await api.put(`/admin/users/${u._id}`, { name, email, role: newRole });
    await loadUsers();
  };

  /* Properties actions */
  const flag = async (p) => { await api.patch(`/admin/properties/${p._id}/flag`); await loadProps(); };
  const unflag = async (p) => { await api.patch(`/admin/properties/${p._id}/unflag`); await loadProps(); };
  const delProp = async (p) => {
    if (!window.confirm('Delete this property?')) return;
    await api.delete(`/admin/properties/${p._id}`);
    await loadProps();
  };

  /* Complaints actions */
  const setComplaintStatus = async (c, status) => {
    await api.patch(`/admin/complaints/${c._id}/status`, { status });
    await loadComplaints();
  };

  return (
    <div className="container">
      <h2 style={{margin:'18px 0'}}>Admin Panel</h2>

      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <button className={`btn ${tab==='users'?'':'secondary'}`} onClick={()=>setTab('users')}>Users</button>
        <button className={`btn ${tab==='properties'?'':'secondary'}`} onClick={()=>setTab('properties')}>Properties</button>
        <button className={`btn ${tab==='complaints'?'':'secondary'}`} onClick={()=>setTab('complaints')}>Complaints</button>
      </div>

      {loading ? <p>Loading…</p> : (
        <>
          {tab === 'users' && (
            <Section title="All Users">
              <div className="grid cards">
                {users.map(u => (
                  <div key={u._id} className="card">
                    <div className="card-body">
                      <div className="card-title">{u.name}</div>
                      <div className="card-meta">{u.email}</div>
                      <div className="card-meta">Role: <b>{u.role}</b></div>
                      <div style={{display:'flex', gap:8, marginTop:10}}>
                        <button className="btn" onClick={()=>changeRole(u)}>Edit / Change role</button>
                        <button className="btn secondary" onClick={()=>deleteUser(u._id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {tab === 'properties' && (
            <Section title="All Properties">
              <div className="grid cards">
                {props.map(p => (
                  <div key={p._id} className="card">
                    <div className="card-body">
                      <div className="card-title">{p.title}</div>
                      <div className="card-meta">{[p.address, p.city, p.state, p.country].filter(Boolean).join(', ')}</div>
                      <div className="card-meta">Rent: {p.rent} • Owner: {p.owner?.name} ({p.owner?.email})</div>
                      <div className="card-meta">Flagged: <b>{p.isFlagged ? 'Yes' : 'No'}</b></div>
                      <div style={{display:'flex', gap:8, marginTop:10}}>
                        {!p.isFlagged
                          ? <button className="btn" onClick={()=>flag(p)}>Flag</button>
                          : <button className="btn" onClick={()=>unflag(p)}>Unflag</button>}
                        <button className="btn secondary" onClick={()=>delProp(p)}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {tab === 'complaints' && (
            <Section title="Complaints">
              <div className="grid cards">
                {complaints.map(c => (
                  <div key={c._id} className="card">
                    <div className="card-body">
                      <div className="card-title">{c.targetType} • {c.status.toUpperCase()}</div>
                      <div className="card-meta">Reason: {c.reason}</div>
                      <div className="card-meta">Reporter: {c.reporter?.name} ({c.reporter?.email})</div>
                      <div style={{display:'flex', gap:8, marginTop:10}}>
                        <button className="btn" onClick={()=>setComplaintStatus(c, 'resolved')}>Mark resolved</button>
                        <button className="btn secondary" onClick={()=>setComplaintStatus(c, 'dismissed')}>Dismiss</button>
                        <button className="btn secondary" onClick={()=>setComplaintStatus(c, 'open')}>Reopen</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}
