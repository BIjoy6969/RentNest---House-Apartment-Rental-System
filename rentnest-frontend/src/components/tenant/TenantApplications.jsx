// src/components/tenant/TenantApplications.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { applicationService } from '../../services/applicationService';
import { useToast } from '../../context/ToastContext';

export default function TenantApplications({
  applications = [],
  loading = false,
  onOpenChat,
  onRefresh
}) {
  const { toast } = useToast();

  // Withdraw Modal
  const [withdrawingApp, setWithdrawingApp] = useState(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);

  // Info Response Modal
  const [respondingApp, setRespondingApp] = useState(null);
  const [infoResponseText, setInfoResponseText] = useState('');
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!withdrawingApp) return;

    setIsSubmittingWithdraw(true);
    try {
      await applicationService.withdraw(withdrawingApp._id, withdrawReason);
      toast.success('Application successfully withdrawn');
      setWithdrawingApp(null);
      setWithdrawReason('');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to withdraw application');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  const handleRespondInfo = async (e) => {
    e.preventDefault();
    if (!respondingApp || !infoResponseText.trim()) return;

    setIsSubmittingInfo(true);
    try {
      await applicationService.respondInfo(respondingApp._id, infoResponseText);
      toast.success('Response sent to landlord');
      setRespondingApp(null);
      setInfoResponseText('');
      if (onRefresh) onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send response');
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your applications…</div>;
  }

  if (applications.length === 0) {
    return (
      <EmptyState
        icon="📝"
        title="No Rental Applications Submitted"
        description="Found a property you love? Submit a digital rental application directly from the listing page."
        actionText="Find Properties"
        onAction={() => window.location.href = '/properties'}
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {applications.map((app) => {
        const prop = app.property || {};
        const landlord = app.landlord || {};
        const isPending = app.status === 'pending';
        const isInfoRequested = app.status === 'info_requested';
        const isRejected = app.status === 'rejected';
        const isWithdrawn = app.status === 'withdrawn';

        return (
          <div
            key={app._id}
            className="rn-card"
            style={{
              padding: '1.5rem',
              borderLeft: isInfoRequested ? '4px solid #f59e0b' : isRejected ? '4px solid #ef4444' : '4px solid var(--primary)'
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
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  📍 {[prop.address, prop.city].filter(Boolean).join(', ')} • Rent: ৳{Number(prop.rent || 0).toLocaleString()} / month
                </p>

                <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--text-main)', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <span><b>Screening Score:</b> <span style={{ color: app.score >= 70 ? '#15803d' : '#b45309', fontWeight: 700 }}>{app.score}%</span></span>
                  <span><b>Monthly Income:</b> ৳{Number(app.form?.incomeMonthly || 0).toLocaleString()}</span>
                  <span><b>Occupation:</b> {app.form?.occupation || app.form?.employmentStatus || 'Employed'}</span>
                  <span><b>Occupants:</b> {app.form?.occupants || 1}</span>
                  <span><b>Submitted:</b> {new Date(app.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                {prop._id && (
                  <Link to={`/property/${prop._id}`}>
                    <Button variant="secondary" size="sm">
                      View Listing
                    </Button>
                  </Link>
                )}
                {landlord._id && onOpenChat && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenChat(prop._id, landlord._id, landlord.name)}
                  >
                    💬 Chat Landlord
                  </Button>
                )}
                {(isPending || isInfoRequested) && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setWithdrawingApp(app)}
                  >
                    Withdraw Application
                  </Button>
                )}
              </div>
            </div>

            {/* Banner if Landlord requested additional info */}
            {isInfoRequested && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <strong style={{ color: '#b45309', display: 'block', fontSize: '0.9rem' }}>
                    ⚠️ Landlord requested additional details:
                  </strong>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#78350f' }}>
                    "{app.additionalInfoRequest?.message}"
                  </p>
                </div>
                <Button size="sm" variant="primary" onClick={() => setRespondingApp(app)}>
                  Respond Now →
                </Button>
              </div>
            )}

            {/* Rejection Details & Category */}
            {isRejected && app.rejectionReason?.category && (
              <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#b91c1c' }}>Decision Reason: </strong>
                <span>{app.rejectionReason.category.replace(/_/g, ' ')}</span>
                {app.rejectionReason.explanation && (
                  <p style={{ margin: '0.25rem 0 0', color: '#7f1d1d', fontStyle: 'italic' }}>
                    "{app.rejectionReason.explanation}"
                  </p>
                )}
              </div>
            )}

            {/* Withdrawn Note */}
            {isWithdrawn && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
                You withdrew this application on {app.rejectionReason?.decidedAt ? new Date(app.rejectionReason.decidedAt).toLocaleDateString() : 'earlier date'}.
              </div>
            )}
          </div>
        );
      })}

      {/* Modal: Withdraw Application */}
      {withdrawingApp && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ marginTop: 0 }}>Withdraw Rental Application</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Are you sure you want to withdraw your application for <strong>{withdrawingApp.property?.title}</strong>?
            </p>
            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  Reason for withdrawal (Optional)
                </label>
                <textarea
                  className="rn-input"
                  rows={3}
                  placeholder="e.g. Found another apartment / Budget change"
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="outline" type="button" onClick={() => setWithdrawingApp(null)}>
                  Cancel
                </Button>
                <Button variant="danger" type="submit" disabled={isSubmittingWithdraw}>
                  {isSubmittingWithdraw ? 'Withdrawing...' : 'Confirm Withdrawal'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Respond to Information Request */}
      {respondingApp && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '500px', width: '100%', padding: '1.75rem' }}>
            <h3 style={{ marginTop: 0 }}>Respond to Landlord</h3>
            <div style={{ padding: '0.75rem', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <strong>Landlord asked:</strong>
              <p style={{ margin: '0.25rem 0 0' }}>"{respondingApp.additionalInfoRequest?.message}"</p>
            </div>

            <form onSubmit={handleRespondInfo}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.4rem' }}>
                  Your Response *
                </label>
                <textarea
                  className="rn-input"
                  rows={4}
                  required
                  placeholder="Type your explanation or requested clarification here..."
                  value={infoResponseText}
                  onChange={(e) => setInfoResponseText(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <Button variant="outline" type="button" onClick={() => setRespondingApp(null)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={isSubmittingInfo}>
                  {isSubmittingInfo ? 'Sending...' : 'Send Response'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

