// src/pages/AdminPanel.js
import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import StatusBadge from '../components/common/StatusBadge';
import Button from '../components/common/Button';
import EmptyState from '../components/common/EmptyState';
import { getImageUrl, DEFAULT_FALLBACK } from '../utils/imageUrl';

export default function AdminPanel() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({ users: 0, properties: 0, bookings: 0, applications: 0, complaints: 0 });
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [complaints, setComplaints] = useState([]);

  /* --------------- Data Loading --------------- */
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data || {});
    } catch { /* ignore if endpoint missing */ }
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const loadProperties = useCallback(async () => {
    try {
      const res = await api.get('/admin/properties');
      setProperties(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  const loadComplaints = useCallback(async () => {
    try {
      const res = await api.get('/admin/complaints');
      setComplaints(res.data || []);
    } catch (e) { console.error(e); }
  }, []);

  useEffect(() => {
    setLoading(true);
    const loadForTab = async () => {
      switch (activeTab) {
        case 'overview': await loadStats(); break;
        case 'users': await loadUsers(); break;
        case 'properties': await loadProperties(); break;
        case 'complaints': await loadComplaints(); break;
        default: break;
      }
      setLoading(false);
    };
    loadForTab();
  }, [activeTab, loadStats, loadUsers, loadProperties, loadComplaints]);

  /* --------------- User Actions --------------- */
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(`User "${name}" deleted`);
      loadUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleEditUser = async (u) => {
    const newRole = prompt('Enter new role (tenant / landlord / admin):', u.role);
    if (!newRole || !['tenant', 'landlord', 'admin'].includes(newRole)) {
      if (newRole) toast.error('Invalid role. Use tenant, landlord, or admin.');
      return;
    }
    const newName = prompt('Enter name:', u.name);
    if (!newName) return;
    const newEmail = prompt('Enter email:', u.email);
    if (!newEmail) return;

    try {
      await api.put(`/admin/users/${u._id}`, { name: newName, email: newEmail, role: newRole });
      toast.success('User updated successfully');
      loadUsers();
    } catch {
      toast.error('Failed to update user');
    }
  };

  /* --------------- Property Actions --------------- */
  const handleFlagProperty = async (p) => {
    try {
      await api.patch(`/admin/properties/${p._id}/flag`);
      toast.success(`"${p.title}" has been flagged for review`);
      loadProperties();
    } catch {
      toast.error('Failed to flag property');
    }
  };

  const handleUnflagProperty = async (p) => {
    try {
      await api.patch(`/admin/properties/${p._id}/unflag`);
      toast.success(`"${p.title}" flag removed`);
      loadProperties();
    } catch {
      toast.error('Failed to unflag property');
    }
  };

  const handleDeleteProperty = async (p) => {
    if (!window.confirm(`Delete property "${p.title}"? This is permanent.`)) return;
    try {
      await api.delete(`/admin/properties/${p._id}`);
      toast.success('Property deleted');
      loadProperties();
    } catch {
      toast.error('Failed to delete property');
    }
  };

  /* --------------- Complaint Actions --------------- */
  const handleComplaintStatus = async (c, status) => {
    try {
      await api.patch(`/admin/complaints/${c._id}/status`, { status });
      toast.success(`Complaint marked as ${status}`);
      loadComplaints();
    } catch {
      toast.error('Failed to update complaint');
    }
  };

  /* --------------- Render --------------- */
  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <span className="section-kicker">Administrator</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Admin Control Panel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage users, moderate listings, and resolve platform complaints
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        {['overview', 'users', 'properties', 'complaints'].map((tab) => (
          <button
            key={tab}
            className={`dashboard-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' && '📊 Overview'}
            {tab === 'users' && `👥 Users (${users.length || '…'})`}
            {tab === 'properties' && `🏢 Properties (${properties.length || '…'})`}
            {tab === 'complaints' && `⚠️ Complaints (${complaints.length || '…'})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading data…
        </div>
      ) : (
        <>
          {/* ====== OVERVIEW TAB ====== */}
          {activeTab === 'overview' && (
            <div>
              <div className="stat-grid">
                <div className="stat-card" onClick={() => setActiveTab('users')} style={{ cursor: 'pointer' }}>
                  <div className="stat-value">{stats.users || 0}</div>
                  <div className="stat-label">Registered Users</div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('properties')} style={{ cursor: 'pointer' }}>
                  <div className="stat-value">{stats.properties || 0}</div>
                  <div className="stat-label">Listed Properties</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.bookings || 0}</div>
                  <div className="stat-label">Total Bookings</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.applications || 0}</div>
                  <div className="stat-label">Rental Applications</div>
                </div>
                <div className="stat-card" onClick={() => setActiveTab('complaints')} style={{ cursor: 'pointer' }}>
                  <div className="stat-value">{stats.complaints || 0}</div>
                  <div className="stat-label">Open Complaints</div>
                </div>
              </div>

              <div className="rn-card" style={{ padding: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  Click any stat card above to drill into management details, or use the tabs to navigate directly.
                </p>
              </div>
            </div>
          )}

          {/* ====== USERS TAB ====== */}
          {activeTab === 'users' && (
            <div>
              {users.length === 0 ? (
                <EmptyState icon="👥" title="No Users Found" description="No registered users in the system." />
              ) : (
                <div className="table-container">
                  <table className="rn-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u._id}>
                          <td style={{ fontWeight: 600 }}>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <StatusBadge
                              status={u.role === 'admin' ? 'flagged' : u.role === 'landlord' ? 'primary' : 'active'}
                              label={u.role.toUpperCase()}
                            />
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <Button variant="outline" size="sm" onClick={() => handleEditUser(u)}>
                                ✏️ Edit
                              </Button>
                              <Button variant="danger" size="sm" onClick={() => handleDeleteUser(u._id, u.name)}>
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ====== PROPERTIES TAB ====== */}
          {activeTab === 'properties' && (
            <div>
              {properties.length === 0 ? (
                <EmptyState icon="🏢" title="No Properties" description="No properties have been listed on the platform yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {properties.map((p) => (
                    <div
                      key={p._id}
                      className="rn-card"
                      style={{
                        padding: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.5rem'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <img
                          src={getImageUrl(p.primaryImage || p.imageUrl || (p.images && p.images[0]?.url))}
                          alt={p.title}
                          style={{ width: '100px', height: '70px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = DEFAULT_FALLBACK;
                          }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{p.title}</h4>
                            <StatusBadge status={p.isActive ? 'active' : 'inactive'} label={p.isActive ? 'Active' : 'Inactive'} />
                            {p.isFlagged && <StatusBadge status="flagged" label="Flagged" />}
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            📍 {[p.address, p.city, p.state].filter(Boolean).join(', ')} • ৳{Number(p.rent || 0).toLocaleString()} / mo
                          </p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            Owner: {p.owner?.name || 'Unknown'} ({p.owner?.email || '—'})
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {!p.isFlagged ? (
                          <Button variant="secondary" size="sm" onClick={() => handleFlagProperty(p)}>
                            🚩 Flag
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleUnflagProperty(p)}>
                            ✓ Unflag
                          </Button>
                        )}
                        <Button variant="danger" size="sm" onClick={() => handleDeleteProperty(p)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ====== COMPLAINTS TAB ====== */}
          {activeTab === 'complaints' && (
            <div>
              {complaints.length === 0 ? (
                <EmptyState icon="✅" title="No Complaints" description="No complaints have been filed yet. Your platform is running smoothly!" />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {complaints.map((c) => (
                    <div
                      key={c._id}
                      className="rn-card"
                      style={{
                        padding: '1.5rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '1.5rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
                            {c.targetType} Complaint
                          </h4>
                          <StatusBadge
                            status={c.status === 'open' ? 'pending' : c.status === 'resolved' ? 'approved' : 'cancelled'}
                            label={c.status?.toUpperCase()}
                          />
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.3rem' }}>
                          <b>Reason:</b> {c.reason}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Filed by: {c.reporter?.name || 'Unknown'} ({c.reporter?.email || '—'}) •{' '}
                          {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleComplaintStatus(c, 'resolved')}
                        >
                          ✓ Resolve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleComplaintStatus(c, 'dismissed')}
                        >
                          Dismiss
                        </Button>
                        {c.status !== 'open' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleComplaintStatus(c, 'open')}
                          >
                            Reopen
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
