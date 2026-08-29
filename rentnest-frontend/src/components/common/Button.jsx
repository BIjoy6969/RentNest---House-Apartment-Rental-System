// src/components/common/Button.jsx
import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md',        // 'sm' | 'md' | 'lg'
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const variantClass = `rn-btn-${variant}`;
  const sizeClass = size !== 'md' ? `rn-btn-${size}` : '';

  return (
    <button
      type={type}
      className={`rn-btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span
            style={{
              width: 16,
              height: 16,
              border: '2px solid currentColor',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 0.8s linear infinite',
              marginRight: 6
            }}
          />
          <span>Loading…</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
