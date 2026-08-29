// src/components/common/Skeleton.jsx
import React from 'react';

export function SkeletonBox({ width = '100%', height = '20px', borderRadius = 'var(--radius-sm)', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
}

export function SkeletonPropertyCard() {
  return (
    <div className="skeleton-card">
      <SkeletonBox width="100%" height="200px" borderRadius="0" />
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <SkeletonBox width="40%" height="24px" />
        <SkeletonBox width="85%" height="18px" />
        <SkeletonBox width="60%" height="14px" />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
          <SkeletonBox width="30%" height="14px" />
          <SkeletonBox width="30%" height="14px" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTableRows({ rows = 4, cols = 4 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: '1rem' }}>
              <SkeletonBox width={j === 0 ? '70%' : '50%'} height="16px" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
