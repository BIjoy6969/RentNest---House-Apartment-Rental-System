// src/components/landlord/LandlordApplications.jsx
import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { applicationService } from '../../services/applicationService';
import { useToast } from '../../context/ToastContext';

const REJECTION_REASONS = [
  { value: 'rental_requirements_not_met', label: 'Rental requirements / income ratio not met' },
  { value: 'property_no_longer_available', label: 'Property is no longer available / rented' },
  { value: 'application_incomplete', label: 'Application details incomplete' },
  { value: 'move_in_date_mismatch', label: 'Requested move-in date does not match availability' },
  { value: 'another_applicant_selected', label: 'Selected another qualified applicant' },
  { value: 'other', label: 'Other landlord preference' }
];

export default function LandlordApplications({
  applications = [],
  loading = false,
  onRefresh,
  onOpenChat
}) {
  const { toast } = useToast();
  const [updatingId, setUpdatingId] = useState(null);

  // Rejection Modal State
  const [rejectingApp, setRejectingApp] = useState(null);
  const [rejectionCategory, setRejectionCategory] = useState('rental_requirements_not_met');
  const [rejectionExplanation, setRejectionExplanation] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Request Info Modal State
  const [requestingApp, setRequestingApp] = useState(null);
  const [requestInfoMessage, setRequestInfoMessage] = useState('');
  const [isSubmittingInfoRequest, setIsSubmittingInfoRequest] = useState(false);

  const handleApprove = async (appId) => {
    setUpdatingId(appId);
    try {
      await applicationService.updateStatus(appId, 'approved', null, '', true);
      toast.success('Application approved! Listing marked as reserved.');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to approve application');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmReject = async (e) => {
    e.preventDefault();
    if (!rejectingApp) return;

    setIsSubmittingReject(true);
    try {
      await applicationService.updateStatus(
        rejectingApp._id,
        'rejected',
        rejectionCategory,
        rejectionExplanation
      );
      toast.info('Application declined with structured reason category');
      setRejectingApp(null);
      setRejectionExplanation('');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to reject application');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleSendInfoRequest = async (e) => {
    e.preventDefault();
    if (!requestingApp || !requestInfoMessage.trim()) return;

    setIsSubmittingInfoRequest(true);
    try {
      await applicationService.requestInfo(requestingApp._id, requestInfoMessage);
      toast.success('Information request sent to tenant');
      setRequestingApp(null);
      setRequestInfoMessage('');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to request information');
    } finally {
      setIsSubmittingInfoRequest(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading rental applications…</div>;
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No Rental Applications Yet"
        description="When tenants apply to rent your properties, their employment background, occupancy details, and screening scores will appear here."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {applications.map((app) => {
        const prop = app.property || {};
        const tenant = app.tenant || {};
        const isPending = app.status === 'pending';
        const isInfoRequested = app.status === 'info_requested';

        return (
          <div
            key={app._id}
            className="rn-card"
            style={{
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              borderLeft: app.status === 'approved' ? '4px solid #22c55e' : app.status === 'rejected' ? '4px solid #ef4444' : '4px solid var(--primary)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                    {prop.title || 'Property Application'}
                  </h4>
                  <StatusBadge status={app.status} />
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0 0 0.25rem' }}>
                  👤 <b>Applicant:</b> {tenant.name} • 📧 {tenant.email} • 📞 {tenant.phone || 'No phone provided'}
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                  Property: {prop.address}, {prop.city} • Rent: ৳{Number(prop.rent || 0).toLocaleString()}/mo
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {(isPending || isInfoRequested) && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={updatingId === app._id}
                      onClick={() => handleApprove(app._id)}
                    >
                      ✓ Approve Applicant
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRequestingApp(app)}
                    >
                      💬 Request Info
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRejectingApp(app)}
                    >
                      ✕ Decline
                    </Button>
                  </>
                )}

                {tenant._id && onOpenChat && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChat(prop._id, tenant._id, tenant.name)}
                  >
                    💬 Message Tenant
                  </Button>
                )}
              </div>
            </div>

            {/* Applicant Screening Details */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                color: 'var(--text-main)'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Screening Score</span>
                <b style={{ fontSize: '1.05rem', color: app.score >= 70 ? '#15803d' : '#b45309' }}>
                  {app.score}% Match
                </b>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Monthly Income</span>
                <b>৳{Number(app.form?.incomeMonthly || 0).toLocaleString()}</b>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Occupation / Employment</span>
                <b>{app.form?.occupation || app.form?.employmentStatus || 'Employed'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Occupants</span>
                <b>{app.form?.occupants || 1} person(s)</b>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Preferred Move-In</span>
                <b>{app.form?.preferredMoveInDate ? new Date(app.form.preferredMoveInDate).toLocaleDateString() : 'Immediate'}</b>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.78rem' }}>Pets</span>
                <b>{app.form?.pets ? 'Yes' : 'No'}</b>
              </div>
            </div>

            {/* Applicant Message */}
            {app.form?.message && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <b>Applicant Note:</b> "{app.form.message}"
              </div>
            )}

            {/* Info Request / Response Thread */}
            {app.additionalInfoRequest?.message && (
              <div style={{ padding: '0.85rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#b45309' }}>You asked: </strong>
                <span>"{app.additionalInfoRequest.message}"</span>
                {app.additionalInfoRequest.response ? (
                  <div style={{ marginTop: '0.4rem', color: '#15803d' }}>
                    <strong>Tenant Response: </strong> "{app.additionalInfoRequest.response}"
                  </div>
                ) : (
                  <div style={{ marginTop: '0.3rem', color: '#78350f', fontStyle: 'italic' }}>
                    Awaiting tenant response...
                  </div>
                )}
              </div>
            )}

            {/* Rejection Audit */}
            {app.status === 'rejected' && app.rejectionReason?.category && (
              <div style={{ padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.825rem', color: '#7f1d1d' }}>
                <strong>Rejection Reason:</strong> {app.rejectionReason.category.replace(/_/g, ' ')}
                {app.rejectionReason.explanation && <span> — "{app.rejectionReason.explanation}"</span>}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal: Decline Application with Reason */}
      {rejectingApp && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Decline Rental Application</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Decline applicant <strong>{rejectingApp.tenant?.name}</strong> for <strong>{rejectingApp.property?.title}</strong>. Please provide a clear, professional reason category.
            </p>

            <form onSubmit={handleConfirmReject}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  Reason Category *
                </label>
                <select
                  className="rn-input"
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem' }}
                  required
                >
                  {REJECTION_REASONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  Explanation Note (Optional)
                </label>
                <textarea
                  className="rn-input"
                  rows={3}
                  placeholder="e.g. Move-in date is too late / Property already reserved for another family."
                  value={rejectionExplanation}
                  onChange={(e) => setRejectionExplanation(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="outline" type="button" onClick={() => setRejectingApp(null)}>
                  Cancel
                </Button>
                <Button variant="danger" type="submit" disabled={isSubmittingReject}>
                  {isSubmittingReject ? 'Declining...' : 'Confirm Decline'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request More Information */}
      {requestingApp && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Request Information from Applicant</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Ask <strong>{requestingApp.tenant?.name}</strong> for additional details before making a rental decision.
            </p>

            <form onSubmit={handleSendInfoRequest}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  Question or Required Document Details *
                </label>
                <textarea
                  className="rn-input"
                  rows={4}
                  required
                  placeholder="e.g. Can you confirm if you will be residing with family? Also please provide your office ID / employment reference."
                  value={requestInfoMessage}
                  onChange={(e) => setRequestInfoMessage(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="outline" type="button" onClick={() => setRequestingApp(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmittingInfoRequest}>
                  {isSubmittingInfoRequest ? 'Sending...' : 'Send Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

