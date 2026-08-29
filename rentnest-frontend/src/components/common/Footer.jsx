// src/components/common/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#0f172a',
        color: '#94a3b8',
        paddingTop: '3.5rem',
        paddingBottom: '2rem',
        marginTop: 'auto',
        borderTop: '1px solid #1e293b'
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2.5rem',
            marginBottom: '3rem'
          }}
        >
          {/* Brand Col */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: '1rem'
                }}
              >
                🏠
              </div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Rent<span style={{ color: '#60a5fa' }}>Nest</span>
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Next-generation house and apartment rental marketplace. Direct landlord-to-tenant communication, verified listings, and secure booking.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', background: '#1e293b', padding: '4px 10px', borderRadius: '4px', color: '#cbd5e1' }}>
                🔒 Secure
              </span>
              <span style={{ fontSize: '0.8rem', background: '#1e293b', padding: '4px 10px', borderRadius: '4px', color: '#cbd5e1' }}>
                ⚡ Fast Booking
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontSize: '1rem' }}>Marketplace</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li>
                <Link to="/properties" style={{ color: '#cbd5e1' }}>Browse All Listings</Link>
              </li>
              <li>
                <Link to="/properties?city=Dhaka" style={{ color: '#cbd5e1' }}>Rentals in Dhaka</Link>
              </li>
              <li>
                <Link to="/properties?city=Rajshahi" style={{ color: '#cbd5e1' }}>Rentals in Rajshahi</Link>
              </li>
              <li>
                <Link to="/register" style={{ color: '#cbd5e1' }}>Create Free Account</Link>
              </li>
            </ul>
          </div>

          {/* User Portals */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontSize: '1rem' }}>Portals</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
              <li>
                <Link to="/tenant" style={{ color: '#cbd5e1' }}>Tenant Dashboard</Link>
              </li>
              <li>
                <Link to="/landlord" style={{ color: '#cbd5e1' }}>Landlord Dashboard</Link>
              </li>
              <li>
                <Link to="/admin" style={{ color: '#cbd5e1' }}>Admin Center</Link>
              </li>
              <li>
                <Link to="/login" style={{ color: '#cbd5e1' }}>Sign In</Link>
              </li>
            </ul>
          </div>

          {/* Contact / Project Info */}
          <div>
            <h4 style={{ color: '#ffffff', marginBottom: '1.2rem', fontSize: '1rem' }}>Project</h4>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '0.75rem' }}>
              CSE470 Full Stack Project
              <br />
              Developed with MERN Stack (React 19, Express, Node.js, MongoDB).
            </p>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Author: A Z M Bodruddoza Bijoy
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            paddingTop: '1.5rem',
            borderTop: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem'
          }}
        >
          <div>
            © {new Date().getFullYear()} RentNest — All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Support</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
