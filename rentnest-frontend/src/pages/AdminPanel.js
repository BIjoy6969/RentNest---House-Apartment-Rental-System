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

  const handleVerifyProperty = async (propertyId, status) => {
    try {
      await api.patch(`/admin/properties/${propertyId}/verify`, { status });
      toast.success(`Property marked as ${status}`);
      loadProperties();
    } catch {
      toast.error('Failed to update property verification status');
    }
  };

  const handleToggleLandlordVerification = async (user) => {
    const nextStatus = user.verificationStatus === 'verified' ? 'unverified' : 'verified';
    try {
      await api.patch(`/admin/users/${user._id}/verify`, { status: nextStatus });
      toast.success(`Landlord ${user.name} marked as ${nextStatus}`);
      loadUsers();
    } catch {
      toast.error('Failed to update landlord verification');
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
      <div className="dashboard-header">
        <div>
          <span className="section-kicker">Platform Administration</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Admin Control Panel</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Moderate property listings, verify landlord credentials, and manage platform integrity
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Stats & Health
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users & Verification ({users.length})
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          🏢 Properties Moderation ({properties.length})
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'complaints' ? 'active' : ''}`}
          onClick={() => setActiveTab('complaints')}
        >
          🚨 Reports & Complaints ({complaints.length})
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Loading admin data…
        </div>
      ) : (
        <>
          {/* ====== OVERVIEW TAB ====== */}
          {activeTab === 'overview' && (
            <div>
              <div className="stat-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.users?.total ?? 0}</div>
                  <div className="stat-label">Total Users</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {stats.users?.tenants ?? 0} tenants • {stats.users?.landlords ?? 0} landlords
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.properties?.total ?? 0}</div>
                  <div className="stat-label">Listed Properties</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {stats.properties?.active ?? 0} active • {stats.properties?.flagged ?? 0} flagged
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.bookings?.total ?? 0}</div>
                  <div className="stat-label">Tour Bookings</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    {stats.bookings?.pending ?? 0} pending review
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-value">{stats.complaints?.total ?? 0}</div>
                  <div className="stat-label">Filed Complaints</div>
                  <div style={{ fontSize: '0.8rem', color: stats.complaints?.open > 0 ? 'var(--danger-text)' : 'var(--success-text)', marginTop: '0.4rem' }}>
                    {stats.complaints?.open ?? 0} open complaints
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ====== USERS TAB ====== */}
          {activeTab === 'users' && (
            <div className="rn-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
              {users.length === 0 ? (
                <EmptyState icon="👥" title="No Users Found" description="There are no registered users on the platform." />
              ) : (
                <table className="rn-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                      <th style={{ padding: '0.75rem' }}>Name</th>
                      <th style={{ padding: '0.75rem' }}>Email</th>
                      <th style={{ padding: '0.75rem' }}>Role</th>
                      <th style={{ padding: '0.75rem' }}>Verification</th>
                      <th style={{ padding: '0.75rem' }}>Joined</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{u.name}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              backgroundColor: u.role === 'admin' ? '#fef3c7' : u.role === 'landlord' ? '#e0f2fe' : '#f1f5f9',
                              color: u.role === 'admin' ? '#b45309' : u.role === 'landlord' ? '#0369a1' : '#475569'
                            }}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {u.role === 'landlord' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleLandlordVerification(u)}
                              style={{
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.2rem 0.6rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: u.verificationStatus === 'verified' ? '#dcfce7' : '#fee2e2',
                                color: u.verificationStatus === 'verified' ? '#15803d' : '#b91c1c'
                              }}
                            >
                              {u.verificationStatus === 'verified' ? '✓ Verified' : '✕ Unverified'}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)}>
                              Edit
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{p.title}</h4>
                            <StatusBadge status={p.isActive ? 'active' : 'inactive'} label={p.isActive ? 'Active' : 'Inactive'} />
                            <span
                              style={{
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: p.verificationStatus === 'approved' ? '#dcfce7' : '#fee2e2',
                                color: p.verificationStatus === 'approved' ? '#15803d' : '#b91c1c'
                              }}
                            >
                              Verification: {p.verificationStatus?.toUpperCase() || 'APPROVED'}
                            </span>
                            {p.isFlagged && <StatusBadge status="flagged" label="Flagged" />}
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem' }}>
                            📍 {[p.address, p.city, p.state].filter(Boolean).join(', ')} • ৳{Number(p.rent || 0).toLocaleString()} / mo
                          </p>
                          <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                            Owner: {p.owner?.name || 'Unknown'} ({p.owner?.email || '—'}) • Views: {p.viewCount || 0}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {p.verificationStatus !== 'approved' ? (
                          <Button variant="primary" size="sm" onClick={() => handleVerifyProperty(p._id, 'approved')}>
                            ✓ Verify
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleVerifyProperty(p._id, 'rejected')}>
                            ✕ Unverify
                          </Button>
                        )}
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
