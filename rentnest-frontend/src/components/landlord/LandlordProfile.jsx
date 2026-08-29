// src/components/landlord/LandlordProfile.jsx
import React, { useState } from 'react';
import Button from '../common/Button';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function LandlordProfile({ user, onProfileUpdated }) {
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/users/profile', {
        name: name.trim(),
        password: password || undefined
      });
      toast.success('Profile updated successfully');
      setPassword('');
      if (onProfileUpdated) onProfileUpdated(res.data);
    } catch (err) {
      toast.error('Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rn-card" style={{ padding: '2rem', maxWidth: '600px' }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
        Landlord Account Settings
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Landlord / Entity Name</label>
          <input
            className="form-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            value={user?.email || ''}
            disabled
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
          />
          <span className="form-hint">Email address cannot be changed</span>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Account Role</label>
          <input
            className="form-input"
            value="LANDLORD (Property Owner)"
            disabled
            style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">New Password (Leave blank to keep current)</label>
          <input
            type="password"
            className="form-input"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
          />
        </div>

        <Button type="submit" variant="primary" loading={loading} style={{ alignSelf: 'flex-start' }}>
          Save Changes
        </Button>
      </form>
    </div>
  );
}
