// src/components/property/ReportPropertyModal.jsx
import React, { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { api } from '../../api';
import { useToast } from '../../context/ToastContext';

export default function ReportPropertyModal({ isOpen, onClose, propertyId, propertyTitle }) {
  const { toast } = useToast();
  const [reasonCategory, setReasonCategory] = useState('scam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!details.trim()) {
      toast.error('Please provide a short explanation for your report');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/complaints', {
        targetType: 'property',
        targetId: propertyId,
        reason: `[${reasonCategory.toUpperCase()}] ${details.trim()}`
      });

      toast.success('Thank you. Your report has been submitted to moderators for review.');
      setDetails('');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Report Suspicious Listing" maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Reporting: <b>{propertyTitle || 'Property'}</b>
        </p>

        <div>
          <label className="form-label" style={{ fontWeight: 600 }}>Reason for Report</label>
          <select
            className="form-control"
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
          >
            <option value="scam">Suspected Fraud or Scam</option>
            <option value="fake_images">Fake or Misleading Images</option>
            <option value="already_rented">Property is Already Rented</option>
            <option value="wrong_price">Inaccurate Price or Fees</option>
            <option value="inappropriate">Inappropriate or Offensive Content</option>
            <option value="other">Other Violation</option>
          </select>
        </div>

        <div>
          <label className="form-label" style={{ fontWeight: 600 }}>Additional Details</label>
          <textarea
            className="form-control"
            rows="4"
            placeholder="Please describe what is incorrect or suspicious about this listing..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" loading={submitting}>
            Submit Report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
