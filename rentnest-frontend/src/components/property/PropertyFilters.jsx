// src/components/property/PropertyFilters.jsx
import React, { useState, useEffect } from 'react';
import Button from '../common/Button';

export default function PropertyFilters({
  filters = {},
  initial = {},
  onFilterChange,
  onApply,
  onReset,
  compact = false
}) {
  const source = Object.keys(filters).length > 0 ? filters : initial;

  const [q, setQ] = useState(source.q || '');
  const [city, setCity] = useState(source.city || '');
  const [minRent, setMinRent] = useState(source.minRent || '');
  const [maxRent, setMaxRent] = useState(source.maxRent || '');
  const [bedrooms, setBedrooms] = useState(source.bedrooms || '');
  const [propertyType, setPropertyType] = useState(source.propertyType || '');
  const [sort, setSort] = useState(source.sort || 'newest');

  useEffect(() => {
    setQ(source.q || '');
    setCity(source.city || '');
    setMinRent(source.minRent !== undefined ? source.minRent : '');
    setMaxRent(source.maxRent !== undefined ? source.maxRent : '');
    setBedrooms(source.bedrooms !== undefined ? source.bedrooms : '');
    setPropertyType(source.propertyType || '');
    setSort(source.sort || 'newest');
  }, [source]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const payload = {
      q: q.trim() || undefined,
      city: city.trim() || undefined,
      minRent: minRent !== '' ? Number(minRent) : undefined,
      maxRent: maxRent !== '' ? Number(maxRent) : undefined,
      bedrooms: bedrooms !== '' ? Number(bedrooms) : undefined,
      propertyType: propertyType || undefined,
      sort: sort || 'newest'
    };

    if (onFilterChange) onFilterChange(payload);
    if (onApply) onApply(payload);
  };

  const handleReset = () => {
    setQ('');
    setCity('');
    setMinRent('');
    setMaxRent('');
    setBedrooms('');
    setPropertyType('');
    setSort('newest');

    if (onReset) onReset();
    else if (onFilterChange) onFilterChange({});
    else if (onApply) onApply({});
  };

  if (compact) {
    return (
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff',
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-md)',
          border: '1px solid var(--border-color)',
          alignItems: 'center'
        }}
      >
        <div style={{ flex: '1 1 200px' }}>
          <input
            className="form-input"
            placeholder="🔍 Search address, title, keyword…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div style={{ flex: '1 1 140px' }}>
          <input
            className="form-input"
            placeholder="📍 City (e.g. Dhaka)"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div style={{ flex: '0 1 130px' }}>
          <select
            className="form-select"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="apartment">Apartment</option>
            <option value="house">House</option>
            <option value="studio">Studio</option>
            <option value="villa">Villa</option>
            <option value="room">Room</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button type="submit" variant="primary">
            Search
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-card)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Filters</h4>
        <button
          type="button"
          onClick={handleReset}
          style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Reset All
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
        {/* Search Query */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Keyword Search</label>
          <input
            className="form-input"
            placeholder="Title, address, area…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Location / City */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">City</label>
          <input
            className="form-input"
            placeholder="e.g. Dhaka, Chittagong"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* Property Type */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Property Type</label>
          <select
            className="form-select"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
          >
            <option value="">All Property Types</option>
            <option value="apartment">Apartment / Flat</option>
            <option value="house">House / Duplex</option>
            <option value="studio">Studio</option>
            <option value="villa">Villa</option>
            <option value="room">Room / Sublet</option>
          </select>
        </div>

        {/* Bedrooms */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Min Bedrooms</label>
          <select
            className="form-select"
            value={bedrooms}
            onChange={(e) => setBedrooms(e.target.value)}
          >
            <option value="">Any Bedrooms</option>
            <option value="1">1+ Bedroom</option>
            <option value="2">2+ Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
            <option value="4">4+ Bedrooms</option>
          </select>
        </div>

        {/* Rent Range */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Monthly Rent Range (৳)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <input
              className="form-input"
              type="number"
              placeholder="Min"
              value={minRent}
              onChange={(e) => setMinRent(e.target.value)}
              min="0"
            />
            <input
              className="form-input"
              type="number"
              placeholder="Max"
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              min="0"
            />
          </div>
        </div>

        {/* Sorting */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Sort By</label>
          <select
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest Listings</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="bedrooms">Most Bedrooms</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>

        <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '0.5rem' }}>
          Apply Filters
        </Button>
      </form>
    </div>
  );
}
