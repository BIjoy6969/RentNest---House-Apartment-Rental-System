// src/components/property/PropertyCompareModal.jsx
import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { getImageUrl } from '../../utils/imageUrl';
import { Link } from 'react-router-dom';

export default function PropertyCompareModal({ isOpen, onClose, properties = [], onRemoveProperty }) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Compare Properties" maxWidth="1000px">
      {properties.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>⚖️</div>
          <h4 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No properties selected for comparison</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Click "Compare" on listing cards to evaluate properties side-by-side.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="rn-table" style={{ width: '100%', minWidth: '600px' }}>
            <thead>
              <tr>
                <th style={{ width: '180px' }}>Feature</th>
                {properties.map((prop) => (
                  <th key={prop._id} style={{ minWidth: '220px', textAlign: 'center' }}>
                    <div style={{ position: 'relative', display: 'inline-block', width: '100%' }}>
                      <img
                        src={getImageUrl(prop.primaryImage || prop.imageUrl)}
                        alt={prop.title}
                        style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }}
                      />
                      <button
                        type="button"
                        onClick={() => onRemoveProperty && onRemoveProperty(prop._id)}
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'rgba(0, 0, 0, 0.65)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem'
                        }}
                        title="Remove from comparison"
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginTop: '0.5rem' }}>{prop.title}</div>
                    <Link to={`/property/${prop._id}`} style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                      View Details →
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600 }}>Monthly Rent</td>
                {properties.map((prop) => (
                  <td key={prop._id} style={{ textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                    ৳{Number(prop.rent).toLocaleString()} /mo
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Location</td>
                {properties.map((prop) => (
                  <td key={prop._id} style={{ textAlign: 'center' }}>
                    {[prop.address, prop.city, prop.state].filter(Boolean).join(', ')}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Bedrooms</td>
                {properties.map((prop) => (
                  <td key={prop._id} style={{ textAlign: 'center' }}>
                    {prop.bedrooms} {prop.bedrooms === 1 ? 'Bed' : 'Beds'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Bathrooms</td>
                {properties.map((prop) => (
                  <td key={prop._id} style={{ textAlign: 'center' }}>
                    {prop.bathrooms} {prop.bathrooms === 1 ? 'Bath' : 'Baths'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Property Type</td>
                {properties.map((prop) => (
                  <td key={prop._id} style={{ textAlign: 'center', textTransform: 'capitalize' }}>
                    {prop.propertyType || 'Apartment'}
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Completeness Score</td>
                {properties.map((prop) => (
                  <td key={prop._id} style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        backgroundColor: (prop.completenessScore || 80) >= 80 ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: (prop.completenessScore || 80) >= 80 ? 'var(--success-text)' : 'var(--warning-text)'
                      }}
                    >
                      {prop.completenessScore || 85}%
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td style={{ fontWeight: 600 }}>Amenities</td>
                {properties.map((prop) => {
                  const items = Array.isArray(prop.amenities) ? prop.amenities : [];
                  return (
                    <td key={prop._id} style={{ textAlign: 'center' }}>
                      {items.length === 0 ? (
                        <span style={{ color: 'var(--text-muted)' }}>None listed</span>
                      ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', justifyContent: 'center' }}>
                          {items.map((am, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: '0.75rem',
                                padding: '0.15rem 0.4rem',
                                backgroundColor: 'var(--bg-subtle)',
                                borderRadius: 'var(--radius-sm)'
                              }}
                            >
                              {am}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
