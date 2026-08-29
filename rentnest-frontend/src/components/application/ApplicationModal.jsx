// src/components/application/ApplicationModal.jsx
import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function ApplicationModal({
  isOpen,
  onClose,
  property,
  onSuccess
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    incomeMonthly: '',
    employmentStatus: 'Employed',
    landlordRating: 5,
    occupants: '1',
    pets: false,
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!property) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.incomeMonthly || Number(form.incomeMonthly) <= 0) {
      toast.error('Please enter your monthly income');
      return;
    }

    setLoading(true);
    try {
      await api.post('/applications', {
        propertyId: property._id,
        form: {
          incomeMonthly: Number(form.incomeMonthly),
          employmentStatus: form.employmentStatus,
          landlordRating: Number(form.landlordRating),
          occupants: Number(form.occupants),
          pets: form.pets,
          message: form.message.trim()
        }
      });

      toast.success('Rental application submitted successfully!');
      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit application. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setForm({
      incomeMonthly: '',
      employmentStatus: 'Employed',
      landlordRating: 5,
      occupants: '1',
      pets: false,
      message: ''
    });
    onClose();
  };

  if (submitted) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Application Submitted">
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Application Under Review
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your application for <b>{property.title}</b> has been received and screening metrics calculated. You can track status on your Tenant Dashboard.
          </p>
          <Button variant="primary" onClick={handleClose} style={{ width: '100%' }}>
            View Dashboard
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Apply for Rental"
      maxWidth="600px"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Submit Application
          </Button>
        </div>
      }
    >
      <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: 600 }}>
          {property.title} • ৳{Number(property.rent || 0).toLocaleString()} / month
        </p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Please provide accurate financial and employment info for landlord verification.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              Monthly Income (৳) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="number"
              className="form-input"
              name="incomeMonthly"
              placeholder="e.g. 60000"
              value={form.incomeMonthly}
              onChange={handleChange}
              min="0"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Employment Status</label>
            <select
              className="form-select"
              name="employmentStatus"
              value={form.employmentStatus}
              onChange={handleChange}
            >
              <option value="Employed">Full-time Employed</option>
              <option value="Self-Employed">Self-Employed / Business</option>
              <option value="Student">Student</option>
              <option value="Freelancer">Freelancer / Contract</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rate Landlord (Impression)</label>
              <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.25rem' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, landlordRating: star }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '1.5rem',
                      color: form.landlordRating >= star ? '#f59e0b' : '#d1d5db',
                      padding: 0,
                      lineHeight: 1
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Number of Occupants</label>
            <input
              type="number"
              className="form-input"
              name="occupants"
              value={form.occupants}
              onChange={handleChange}
              min="1"
              max="10"
              required
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.25rem 0' }}>
          <input
            type="checkbox"
            id="appPets"
            name="pets"
            checked={form.pets}
            onChange={handleChange}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="appPets" style={{ fontSize: '0.9rem', color: 'var(--text-main)', cursor: 'pointer' }}>
            I have or plan to keep pets
          </label>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Message to Landlord (Optional)</label>
          <textarea
            className="form-textarea"
            rows="3"
            name="message"
            placeholder="Tell the landlord about yourself, move-in date preference, etc."
            value={form.message}
            onChange={handleChange}
          />
        </div>
      </form>
    </Modal>
  );
}
