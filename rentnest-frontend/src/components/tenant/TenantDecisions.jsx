// src/components/tenant/TenantDecisions.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { tourDecisionService } from '../../services/tourDecisionService';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { Link } from 'react-router-dom';

const REASON_OPTIONS = [
  { value: 'rent_too_high', label: 'Rent is higher than budget / expected' },
  { value: 'location_not_suitable', label: 'Location or neighborhood is not suitable' },
  { value: 'property_condition', label: 'Property condition / repairs needed' },
  { value: 'amenities_dont_match', label: 'Amenities or space do not match listing' },
  { value: 'found_another_property', label: 'Found another property' },
  { value: 'landlord_communication_issue', label: 'Communication / policy mismatch' },
  { value: 'other', label: 'Other personal reasons' }
];

export default function TenantDecisions({ bookings = [], onRefresh, onOpenChat }) {
  const { toast } = useToast();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Decision Modal State
  const [activeBooking, setActiveBooking] = useState(null);
  const [decisionStatus, setDecisionStatus] = useState('interested');
  const [reasonCategory, setReasonCategory] = useState('rent_too_high');
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadDecisions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tourDecisionService.getMine();
      setDecisions(data || []);
    } catch (e) {
      console.error('Failed to load tour decisions', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  const handleOpenDecisionModal = (booking) => {
    setActiveBooking(booking);
    setDecisionStatus('interested');
    setReasonCategory('rent_too_high');
    setExplanation('');
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!activeBooking) return;

    if (decisionStatus === 'not_interested' && !reasonCategory) {
      toast.error('Please select a reason for not proceeding');
      return;
    }

    setSubmitting(true);
    try {
      await tourDecisionService.submitTenantDecision({
        bookingId: activeBooking._id,
        status: decisionStatus,
        reasonCategory: decisionStatus === 'not_interested' ? reasonCategory : null,
        explanation
      });

      toast.success(
        decisionStatus === 'interested'
          ? 'Great! Your interest was shared with the landlord.'
          : 'Your decision was saved transparently.'
      );

      setActiveBooking(null);
      loadDecisions();
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  // Completed or approved tours eligible for feedback
  const decidedBookingIds = new Set(decisions.map((d) => String(d.booking?._id || d.booking)));
  const pendingTourFeedback = bookings.filter(
    (b) => ['completed', 'approved'].includes(b.status) && !decidedBookingIds.has(String(b._id))
  );

  return (
    <div className="rn-card" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.35rem' }}>Two-Sided Tour Decisions & Feedback</h3>
        <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0', fontSize: '0.925rem' }}>
          Take control of your rental journey. Mark whether you are interested in a property after your viewing tour, or explain what didn’t work.
        </p>
      </div>

      {/* Action Required: Tours waiting for feedback */}
      {pendingTourFeedback.length > 0 && (
        <div
          style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '10px',
            padding: '1.25rem',
            marginBottom: '2rem'
          }}
        >
          <h4 style={{ color: '#1e40af', margin: '0 0 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⭐</span> Action Needed: Tours Awaiting Your Decision ({pendingTourFeedback.length})
          </h4>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pendingTourFeedback.map((b) => (
              <div
                key={b._id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #dbeafe',
                  borderRadius: '8px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h5 style={{ margin: '0 0 0.25rem' }}>{b.property?.title || 'Rental Property'}</h5>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    📍 {b.property?.address}, {b.property?.city} • Viewed on {new Date(b.scheduledAt).toLocaleDateString()}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button size="sm" variant="primary" onClick={() => handleOpenDecisionModal(b)}>
                    Record Decision →
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision History List */}
      <div>
        <h4 style={{ marginBottom: '1rem' }}>Your Tour Decisions & Audit Trail</h4>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading decisions...</p>
        ) : decisions.length === 0 ? (
          <EmptyState
            icon="🤝"
            title="No Tour Decisions Recorded"
            description="When you complete viewing tours, you can record whether you're interested or not interested right here."
          />
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {decisions.map((d) => {
              const status = d.tenantDecision?.status;
              const isInterested = status === 'interested';
              const isNotInterested = status === 'not_interested';

              return (
                <div
                  key={d._id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '10px',
                    padding: '1.25rem',
                    backgroundColor: isInterested ? '#f0fdf4' : isNotInterested ? '#fef2f2' : '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <h4 style={{ margin: 0 }}>{d.property?.title || 'Rental Property'}</h4>
                        <span
                          style={{
                            padding: '0.2rem 0.65rem',
                            borderRadius: '20px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            backgroundColor: isInterested ? '#dcfce7' : isNotInterested ? '#fee2e2' : '#f1f5f9',
                            color: isInterested ? '#15803d' : isNotInterested ? '#b91c1c' : '#475569'
                          }}
                        >
                          {status ? status.replace(/_/g, ' ').toUpperCase() : 'PENDING'}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        📍 {d.property?.address}, {d.property?.city} • Rent: ৳{d.property?.rent?.toLocaleString()}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {isInterested && (
                        <Link to={`/property/${d.property?._id}`}>
                          <Button size="sm" variant="primary">
                            Apply for Property 📝
                          </Button>
                        </Link>
                      )}
                      {onOpenChat && d.landlord && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenChat(d.property?._id, d.landlord._id, d.landlord.name)}
                        >
                          Chat Landlord 💬
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Reasons & Explanation */}
                  {d.tenantDecision?.reasonCategory && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#7f1d1d' }}>
                      <strong>Reason: </strong> {d.tenantDecision.reasonCategory.replace(/_/g, ' ')}
                    </div>
                  )}

                  {d.tenantDecision?.explanation && (
                    <div style={{ marginTop: '0.35rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      "{d.tenantDecision.explanation}"
                    </div>
                  )}

                  {/* Audit Trail Note */}
                  <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(0,0,0,0.1)', fontSize: '0.78rem', color: '#64748b' }}>
                    Decided on {d.tenantDecision?.decidedAt ? new Date(d.tenantDecision.decidedAt).toLocaleString() : 'N/A'} • Landlord Status:{' '}
                    <strong>{d.landlordDecision?.status || 'Pending Review'}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Decision Modal */}
      {activeBooking && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '520px', width: '100%', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>How was your viewing tour?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
              For <strong>{activeBooking.property?.title}</strong>
            </p>

            <form onSubmit={handleSubmitDecision}>
              {/* Radio Group for Decision */}
              <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem',
                    border: `2px solid ${decisionStatus === 'interested' ? '#22c55e' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: decisionStatus === 'interested' ? '#f0fdf4' : '#ffffff'
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="interested"
                    checked={decisionStatus === 'interested'}
                    onChange={() => setDecisionStatus('interested')}
                  />
                  <div>
                    <strong style={{ display: 'block', color: '#15803d' }}>💚 I am Interested</strong>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>I want to apply or proceed with this property</span>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem',
                    border: `2px solid ${decisionStatus === 'not_interested' ? '#ef4444' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: decisionStatus === 'not_interested' ? '#fef2f2' : '#ffffff'
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="not_interested"
                    checked={decisionStatus === 'not_interested'}
                    onChange={() => setDecisionStatus('not_interested')}
                  />
                  <div>
                    <strong style={{ display: 'block', color: '#b91c1c' }}>❌ Not Interested</strong>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>I do not want to rent this property (requires reason)</span>
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.85rem',
                    border: `2px solid ${decisionStatus === 'need_more_time' ? '#3b82f6' : 'var(--border-color)'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    backgroundColor: decisionStatus === 'need_more_time' ? '#eff6ff' : '#ffffff'
                  }}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="need_more_time"
                    checked={decisionStatus === 'need_more_time'}
                    onChange={() => setDecisionStatus('need_more_time')}
                  />
                  <div>
                    <strong style={{ display: 'block', color: '#1d4ed8' }}>⏳ Need More Time</strong>
                    <span style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>Still comparing with other options</span>
                  </div>
                </label>
              </div>

              {/* Conditional Reason Category if Not Interested */}
              {decisionStatus === 'not_interested' && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                    Why are you passing on this property? *
                  </label>
                  <select
                    className="rn-input"
                    value={reasonCategory}
                    onChange={(e) => setReasonCategory(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.6rem' }}
                  >
                    {REASON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Optional Explanation */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  Additional Notes (Optional)
                </label>
                <textarea
                  className="rn-input"
                  rows={3}
                  placeholder={
                    decisionStatus === 'interested'
                      ? 'e.g. Loved the natural lighting, ready to move in October.'
                      : 'e.g. The bedroom was smaller than expected from the photos.'
                  }
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem' }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="outline" type="button" onClick={() => setActiveBooking(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Submit Decision'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
