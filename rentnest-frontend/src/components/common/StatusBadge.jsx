// src/components/common/StatusBadge.jsx
import React from 'react';

export default function StatusBadge({ status = 'pending', label }) {
  const normStatus = String(status).toLowerCase();
  let badgeClass = 'rn-badge-info';

  if (['approved', 'active', 'resolved'].includes(normStatus)) {
    badgeClass = 'rn-badge-approved';
  } else if (['pending', 'in_review'].includes(normStatus)) {
    badgeClass = 'rn-badge-pending';
  } else if (['rejected', 'flagged', 'dismissed'].includes(normStatus)) {
    badgeClass = 'rn-badge-rejected';
  } else if (['cancelled', 'inactive'].includes(normStatus)) {
    badgeClass = 'rn-badge-cancelled';
  }

  const dotColor = {
    'rn-badge-approved': '#10B981',
    'rn-badge-pending': '#F59E0B',
    'rn-badge-rejected': '#EF4444',
    'rn-badge-cancelled': '#94A3B8',
    'rn-badge-info': '#3B82F6',
  }[badgeClass] || '#3B82F6';

  return (
    <span className={`rn-badge ${badgeClass}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: dotColor,
          display: 'inline-block'
        }}
      />
      {label || normStatus}
    </span>
  );
}
