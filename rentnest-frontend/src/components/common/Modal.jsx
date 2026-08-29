// src/components/common/Modal.jsx
import React, { useEffect } from 'react';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = '560px'
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="rn-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="rn-modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rn-modal-header">
          <h3 className="rn-modal-title">{title}</h3>
          <button
            className="rn-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        <div className="rn-modal-body">{children}</div>
        {footer && <div className="rn-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
