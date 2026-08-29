// src/components/booking/BookingModal.jsx
import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function BookingModal({
  isOpen,
  onClose,
  property,
  onSuccess
}) {
  const { toast } = useToast();
  const [scheduledAt, setScheduledAt] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  if (!property) return null;

  // Calculate min datetime string (now + 1 hour)
  const minDate = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledAt) {
      toast.error('Please select a valid date and time for the viewing');
      return;
    }

    setLoading(true);
    try {
      await api.post('/bookings', {
        property: property._id,
        scheduledAt: new Date(scheduledAt).toISOString(),
        note: note ? note.trim() : '—'
      });

      // Auto-save to wishlist for tenant convenience
      try {
        await api.post(`/favorites/${property._id}`);
      } catch {}

      toast.success('Viewing request submitted successfully!');
      setConfirmed(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit booking request. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmed(false);
    setScheduledAt('');
    setNote('');
    onClose();
  };

  if (confirmed) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Request Confirmed">
        <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Viewing Request Sent!
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your request to tour <b>{property.title}</b> has been sent to the landlord. You will receive an update once they approve your appointment.
          </p>
          <Button variant="primary" onClick={handleClose} style={{ width: '100%' }}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Schedule Property Viewing"
      footer={
        <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Request Viewing
          </Button>
        </div>
      }
    >
      <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <img
          src={property.imageUrl || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=1200&auto=format&fit=crop'}
          alt={property.title}
          style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
        />
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{property.title}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            ৳{Number(property.rent || 0).toLocaleString()} / month • {property.city}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">
            Preferred Date & Time <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="datetime-local"
            className="form-input"
            min={minDate}
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
          />
          <span className="form-hint">Choose a time that works best for you to tour the property</span>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Note for the Landlord (Optional)</label>
          <textarea
            className="form-textarea"
            rows="3"
            placeholder="e.g. Any questions or specific times you prefer..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
