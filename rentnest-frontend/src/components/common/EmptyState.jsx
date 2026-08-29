// src/components/common/EmptyState.jsx
import React from 'react';
import Button from './Button';

export default function EmptyState({
  icon = '🏠',
  title = 'No properties found',
  description = 'Try adjusting your search criteria or filters.',
  actionText,
  onAction
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-desc">{description}</p>
      {actionText && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
