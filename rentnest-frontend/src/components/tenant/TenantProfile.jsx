// src/components/tenant/TenantProfile.jsx
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function TenantProfile({ user, onProfileUpdated }) {
  const { toast } = useToast();
  
  // Basic Info
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Rental Preferences
  const [preferredAreas, setPreferredAreas] = useState(
    user?.rentalPreferences?.preferredAreas?.join(', ') || 'Mirpur, Dhanmondi, Uttara'
  );
  const [minBudget, setMinBudget] = useState(user?.rentalPreferences?.minBudget || 15000);
  const [maxBudget, setMaxBudget] = useState(user?.rentalPreferences?.maxBudget || 35000);
  const [minBedrooms, setMinBedrooms] = useState(user?.rentalPreferences?.minBedrooms || 2);
  const [needsParking, setNeedsParking] = useState(user?.rentalPreferences?.needsParking || false);
  const [prefersFurnished, setPrefersFurnished] = useState(user?.rentalPreferences?.prefersFurnished || false);
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      if (user.rentalPreferences) {
        setPreferredAreas(user.rentalPreferences.preferredAreas?.join(', ') || '');
        setMinBudget(user.rentalPreferences.minBudget ?? 15000);
        setMaxBudget(user.rentalPreferences.maxBudget ?? 35000);
        setMinBedrooms(user.rentalPreferences.minBedrooms ?? 2);
        setNeedsParking(!!user.rentalPreferences.needsParking);
        setPrefersFurnished(!!user.rentalPreferences.prefersFurnished);
      }
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/users/profile', {
        name: name.trim(),
        phone: phone.trim(),
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

  const handlePreferencesSubmit = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const areasList = preferredAreas.split(',').map(s => s.trim()).filter(Boolean);
      await api.patch('/users/preferences', {
        preferredAreas: areasList,
        minBudget: Number(minBudget),
        maxBudget: Number(maxBudget),
        minBedrooms: Number(minBedrooms),
        needsParking,
        prefersFurnished
      });
      toast.success('Rental preferences saved! Smart matches updated.');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      toast.error('Could not save rental preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
      {/* Account Settings Form */}
      <div className="rn-card" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Account Settings
        </h3>

        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Phone Number</label>
            <input
              className="form-input"
              placeholder="e.g. +880 1712-345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">New Password (Optional)</label>
            <input
              type="password"
              className="form-input"
              placeholder="Leave blank to keep current"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <Button type="submit" variant="primary" loading={loading} style={{ alignSelf: 'flex-start' }}>
            Save Account Details
          </Button>
        </form>
      </div>

      {/* Tenant Rental Preferences Form */}
      <div className="rn-card" style={{ padding: '2rem', borderTop: '4px solid var(--primary)' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.25rem' }}>
            🎯 Rental Preferences & Smart Match
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            We use these preferences to calculate your % compatibility score for available properties.
          </p>
        </div>

        <form onSubmit={handlePreferencesSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Preferred Neighborhoods / Areas (Comma separated)</label>
            <input
              className="form-input"
              placeholder="e.g. Mirpur, Dhanmondi, Gulshan, Uttara"
              value={preferredAreas}
              onChange={(e) => setPreferredAreas(e.target.value)}
            />
            <span className="form-hint">E.g., Mirpur 10, Banani, Bashundhara</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Min Budget (৳)</label>
              <input
                type="number"
                className="form-input"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                min={0}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max Budget (৳)</label>
              <input
                type="number"
                className="form-input"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                min={0}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Minimum Bedrooms</label>
            <select
              className="form-input"
              value={minBedrooms}
              onChange={(e) => setMinBedrooms(e.target.value)}
            >
              <option value={1}>1 Bedroom</option>
              <option value={2}>2 Bedrooms</option>
              <option value={3}>3 Bedrooms</option>
              <option value={4}>4+ Bedrooms</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={needsParking}
                onChange={(e) => setNeedsParking(e.target.checked)}
              />
              Garage / Parking Needed
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
              <input
                type="checkbox"
                checked={prefersFurnished}
                onChange={(e) => setPrefersFurnished(e.target.checked)}
              />
              Furnished Preferred
            </label>
          </div>

          <Button type="submit" variant="primary" loading={savingPrefs} style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}>
            Update Match Preferences
          </Button>
        </form>
      </div>
    </div>
  );
}

