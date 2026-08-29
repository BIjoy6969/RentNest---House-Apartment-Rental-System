// src/components/landlord/LandlordDecisions.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { tourDecisionService } from '../../services/tourDecisionService';
import { useToast } from '../../context/ToastContext';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

export default function LandlordDecisions({ onOpenChat }) {
  const { toast } = useToast();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDecisions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await tourDecisionService.getLandlordDecisions();
      setDecisions(data || []);
    } catch (e) {
      console.error('Failed to load landlord tour decisions', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecisions();
  }, [loadDecisions]);

  const handleUpdateLandlordStatus = async (decisionId, status) => {
    try {
      await tourDecisionService.submitLandlordDecision(decisionId, { status });
      toast.success(`Updated status to ${status}`);
      loadDecisions();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="rn-card" style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.35rem' }}>Tenant Tour Decisions & Lead Pipeline</h3>
        <p style={{ color: 'var(--text-secondary)', margin: '0.35rem 0 0', fontSize: '0.925rem' }}>
          See which renters are interested in your properties after their tour viewings and track why others passed.
        </p>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-secondary)' }}>Loading tour decisions...</p>
      ) : decisions.length === 0 ? (
        <EmptyState
          icon="📊"
          title="No Tour Decisions Received Yet"
          description="When tenants complete viewings of your properties, their feedback and decisions will appear here."
        />
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {decisions.map((d) => {
            const tenantStatus = d.tenantDecision?.status;
            const isInterested = tenantStatus === 'interested';
            const isNotInterested = tenantStatus === 'not_interested';

            return (
              <div
                key={d._id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '1.25rem',
                  backgroundColor: isInterested ? '#f0fdf4' : isNotInterested ? '#fef2f2' : '#ffffff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <h4 style={{ margin: 0 }}>{d.tenant?.name || 'Tenant'}</h4>
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
                        {tenantStatus ? tenantStatus.replace(/_/g, ' ').toUpperCase() : 'PENDING'}
                      </span>
                    </div>

                    <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      Property: <strong>{d.property?.title}</strong> ({d.property?.city}) • Phone: {d.tenant?.phone || 'N/A'} • Email: {d.tenant?.email}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {onOpenChat && d.tenant && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenChat(d.property?._id, d.tenant._id, d.tenant.name)}
                      >
                        Message Tenant 💬
                      </Button>
                    )}

                    {isInterested && (
                      <Button
                        size="sm"
                        variant={d.landlordDecision?.status === 'considering' ? 'primary' : 'outline'}
                        onClick={() => handleUpdateLandlordStatus(d._id, 'considering')}
                      >
                        {d.landlordDecision?.status === 'considering' ? '✓ In Consideration' : 'Mark In Consideration'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tenant Reason if Rejected */}
                {isNotInterested && d.tenantDecision?.reasonCategory && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#b91c1c' }}>
                    <strong>Feedback Reason:</strong> {d.tenantDecision.reasonCategory.replace(/_/g, ' ')}
                  </div>
                )}

                {d.tenantDecision?.explanation && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    "{d.tenantDecision.explanation}"
                  </div>
                )}

                <div style={{ marginTop: '0.75rem', paddingTop: '0.5rem', borderTop: '1px dashed rgba(0,0,0,0.1)', fontSize: '0.78rem', color: '#64748b' }}>
                  Decided: {d.tenantDecision?.decidedAt ? new Date(d.tenantDecision.decidedAt).toLocaleString() : 'Pending'} • Audit ID: {d._id}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
