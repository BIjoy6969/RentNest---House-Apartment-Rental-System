// src/pages/UnauthorizedPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function UnauthorizedPage() {
  return (
    <div
      className="container"
      style={{
        minHeight: 'calc(100vh - var(--header-height) - 150px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '3rem 1.5rem'
      }}
    >
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
      <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
        Access Restricted
      </h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', marginBottom: '2rem', lineHeight: 1.6 }}>
        You don’t have authorization to access this area. Please make sure you are signed in with the correct account role.
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/">
          <Button variant="primary">Go to Home</Button>
        </Link>
        <Link to="/login">
          <Button variant="secondary">Switch Account</Button>
        </Link>
      </div>
    </div>
  );
}
