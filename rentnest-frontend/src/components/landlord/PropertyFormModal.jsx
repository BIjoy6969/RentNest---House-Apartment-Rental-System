import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { propertyService } from '../../services/propertyService';
import { useToast } from '../../context/ToastContext';
import { getImageUrl } from '../../utils/imageUrl';

export default function PropertyFormModal({
  isOpen,
  onClose,
  initialProperty = null,
  onSuccess
}) {
  const { toast } = useToast();
  const isEditing = !!initialProperty;

  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'Bangladesh',
    area: '',
    rent: '',
    bedrooms: 2,
    bathrooms: 2,
    amenities: '',
    propertyType: 'apartment',
    status: 'available',
    isActive: true,
    // Costs
    serviceCharge: 0,
    parkingCost: 0,
    internetCost: 0,
    advanceMonths: 1,
    securityDeposit: 0,
    // Rules
    familyAllowed: true,
    bachelorAllowed: true,
    studentAllowed: true,
    petsAllowed: false,
    smokingAllowed: false,
    minLeaseDurationMonths: 6
  });

  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialProperty) {
      const c = initialProperty.costs || {};
      const r = initialProperty.rules || {};
      const loc = initialProperty.location || {};

      setForm({
        title: initialProperty.title || '',
        description: initialProperty.description || '',
        address: initialProperty.address || '',
        city: initialProperty.city || '',
        state: initialProperty.state || '',
        country: initialProperty.country || 'Bangladesh',
        area: loc.area || '',
        rent: initialProperty.rent || '',
        bedrooms: initialProperty.bedrooms || 1,
        bathrooms: initialProperty.bathrooms || 1,
        amenities: Array.isArray(initialProperty.amenities)
          ? initialProperty.amenities.join(', ')
          : (initialProperty.amenities || ''),
        propertyType: initialProperty.propertyType || 'apartment',
        status: initialProperty.status || 'available',
        isActive: initialProperty.isActive !== false,
        // Costs
        serviceCharge: c.serviceCharge || 0,
        parkingCost: c.parking || 0,
        internetCost: c.internet || 0,
        advanceMonths: c.advanceMonths || 1,
        securityDeposit: c.securityDeposit || 0,
        // Rules
        familyAllowed: r.familyAllowed !== false,
        bachelorAllowed: r.bachelorAllowed !== false,
        studentAllowed: r.studentAllowed !== false,
        petsAllowed: !!r.petsAllowed,
        smokingAllowed: !!r.smokingAllowed,
        minLeaseDurationMonths: r.minLeaseDurationMonths || 6
      });
      setExistingImages(initialProperty.images || []);
    } else {
      setForm({
        title: '',
        description: '',
        address: '',
        city: '',
        state: '',
        country: 'Bangladesh',
        area: '',
        rent: '',
        bedrooms: 2,
        bathrooms: 2,
        amenities: 'Lift, Generator, Security, Gas, Balcony',
        propertyType: 'apartment',
        status: 'available',
        isActive: true,
        serviceCharge: 2000,
        parkingCost: 0,
        internetCost: 0,
        advanceMonths: 1,
        securityDeposit: 0,
        familyAllowed: true,
        bachelorAllowed: true,
        studentAllowed: true,
        petsAllowed: false,
        smokingAllowed: false,
        minLeaseDurationMonths: 6
      });
      setExistingImages([]);
    }
    setSelectedFiles([]);
    setNewPreviews([]);
  }, [initialProperty, isOpen]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [newPreviews]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const validFiles = files.filter((f) => f.type.startsWith('image/'));
    if (validFiles.length + existingImages.length + selectedFiles.length > 10) {
      toast.error('You can upload a maximum of 10 photos per listing');
      return;
    }

    const newObjUrls = validFiles.map((f) => URL.createObjectURL(f));
    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setNewPreviews((prev) => [...prev, ...newObjUrls]);
  };

  const handleRemoveNewFile = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!isEditing || !initialProperty?._id) return;
    try {
      await propertyService.deleteImage(initialProperty._id, imageId);
      setExistingImages((prev) => prev.filter((img) => img._id !== imageId));
      toast.success('Photo removed');
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Could not remove photo');
    }
  };

  const handleSetPrimaryExisting = async (imageId) => {
    if (!isEditing || !initialProperty?._id) return;
    try {
      await propertyService.setPrimaryImage(initialProperty._id, imageId);
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, isPrimary: img._id === imageId }))
      );
      toast.success('Cover photo updated');
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Could not set cover photo');
    }
  };

  const calculateLiveScore = () => {
    let score = 0;
    if (form.title?.trim().length >= 10) score += 10;
    else if (form.title?.trim().length > 0) score += 5;

    if (form.description?.trim().length >= 50) score += 20;
    else if (form.description?.trim().length >= 20) score += 10;

    if (form.address && form.city) score += 15;
    else if (form.city) score += 8;

    if (Number(form.rent) > 0 && Number(form.bedrooms) > 0 && Number(form.bathrooms) > 0) score += 15;

    const ams = form.amenities ? form.amenities.split(',').filter(Boolean) : [];
    if (ams.length >= 3) score += 15;
    else if (ams.length >= 1) score += 8;

    const totalImages = existingImages.length + selectedFiles.length;
    if (totalImages >= 5) score += 25;
    else if (totalImages >= 3) score += 18;
    else if (totalImages >= 1) score += 10;

    return Math.min(100, Math.max(0, score));
  };

  const liveScore = calculateLiveScore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.address || !form.city || !form.rent) {
      toast.error('Please fill in all required listing fields');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('address', form.address.trim());
    formData.append('city', form.city.trim());
    formData.append('state', (form.state || '').trim());
    formData.append('country', form.country || 'Bangladesh');
    formData.append('area', (form.area || '').trim());
    formData.append('rent', Number(form.rent));
    formData.append('bedrooms', Number(form.bedrooms));
    formData.append('bathrooms', Number(form.bathrooms));
    formData.append('amenities', form.amenities);
    formData.append('propertyType', form.propertyType);
    formData.append('status', form.status);
    formData.append('isActive', form.isActive);

    // Bangladesh Costs
    formData.append('serviceCharge', Number(form.serviceCharge) || 0);
    formData.append('parkingCost', Number(form.parkingCost) || 0);
    formData.append('internetCost', Number(form.internetCost) || 0);
    formData.append('advanceMonths', Number(form.advanceMonths) || 1);
    formData.append('securityDeposit', Number(form.securityDeposit) || 0);

    // Property Rules
    formData.append('familyAllowed', form.familyAllowed);
    formData.append('bachelorAllowed', form.bachelorAllowed);
    formData.append('studentAllowed', form.studentAllowed);
    formData.append('petsAllowed', form.petsAllowed);
    formData.append('smokingAllowed', form.smokingAllowed);
    formData.append('minLeaseDurationMonths', Number(form.minLeaseDurationMonths) || 6);

    selectedFiles.forEach((file) => {
      formData.append('images', file);
    });

    try {
      if (isEditing) {
        await propertyService.update(initialProperty._id, formData);
        toast.success('Property updated successfully!');
      } else {
        await propertyService.create(formData);
        toast.success('Property published successfully!');
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save property listing');
    } finally {
      setLoading(false);
    }
  };

return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '✨ Edit Property Listing' : '✨ List a New Property'}
      maxWidth="850px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Modern Header / Completeness Meter */}
        <div style={{
          background: 'var(--bg-subtle)',
          padding: '1.5rem',
          borderRadius: '16px',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.7), 0 4px 6px -1px rgba(0,0,0,0.05)',
          border: '1px solid var(--border-color)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 800 }}>Listing Quality Score</h3>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {liveScore >= 80 ? '🌟 Excellent! Your property will rank higher in searches.' : 'Add more details (photos, amenities) to boost your ranking.'}
              </p>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: liveScore >= 80 ? '#10b981' : '#3b82f6', lineHeight: 1 }}>
              {liveScore}<span style={{ fontSize: '1rem', color: '#94a3b8' }}>/100</span>
            </div>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-muted)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${liveScore}%`,
                height: '100%',
                background: liveScore >= 80 ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>

        {/* --- SECTION 1: Core Details --- */}
        <section className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            🏠 Core Details
          </h4>
          
          <div>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Catchy Property Title *</label>
            <input
              type="text"
              name="title"
              className="form-control"
              style={{ fontSize: '1.05rem', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              placeholder="e.g. Modern Luxury 3-Bedroom Apartment in Gulshan 2"
              value={form.title}
              onChange={handleChange}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Property Category</label>
              <select
                name="propertyType"
                className="form-control"
                style={{ borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid var(--border-color)' }}
                value={form.propertyType}
                onChange={handleChange}
              >
                <option value="apartment">Family Apartment / Flat</option>
                <option value="bachelor">Bachelor Accommodation / Mess</option>
                <option value="family">Family House / Duplex</option>
                <option value="student">Student Hostel / Room</option>
                <option value="sublet">Sublet Room</option>
                <option value="hostel">Hostel</option>
                <option value="studio">Studio Apartment</option>
                <option value="villa">Luxury Villa</option>
                <option value="room">Single Room</option>
                <option value="office">Commercial Office Space</option>
                <option value="shop">Commercial Shop</option>
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Base Rent (৳ / month) *</label>
              <input
                type="number"
                name="rent"
                className="form-control"
                style={{ borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid var(--border-color)', fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}
                placeholder="e.g. 35000"
                min="0"
                value={form.rent}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Listing Status</label>
              <select
                name="status"
                className="form-control"
                style={{ borderRadius: '8px', padding: '0.75rem 1rem', border: '1px solid var(--border-color)' }}
                value={form.status}
                onChange={handleChange}
              >
                <option value="available">✅ Available Now</option>
                <option value="reserved">⏳ Reserved / Pending</option>
                <option value="rented">🔴 Currently Rented</option>
                <option value="pending_review">📝 Draft / Hidden</option>
              </select>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: Costs & Deposits --- */}
        <section className="form-section">
          <div style={{ background: 'var(--bg-subtle)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              💳 Transparent Cost Breakdown
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Service Charge (৳)</label>
                <input type="number" name="serviceCharge" className="form-control" style={{ borderRadius: '6px' }} placeholder="0" min="0" value={form.serviceCharge} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Parking (৳)</label>
                <input type="number" name="parkingCost" className="form-control" style={{ borderRadius: '6px' }} placeholder="0" min="0" value={form.parkingCost} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Advance (Months)</label>
                <input type="number" name="advanceMonths" className="form-control" style={{ borderRadius: '6px' }} placeholder="1" min="0" value={form.advanceMonths} onChange={handleChange} />
              </div>
              <div>
                <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Security Deposit (৳)</label>
                <input type="number" name="securityDeposit" className="form-control" style={{ borderRadius: '6px' }} placeholder="0" min="0" value={form.securityDeposit} onChange={handleChange} />
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: Tenant Rules --- */}
        <section className="form-section">
          <div style={{ background: 'var(--success-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--success-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h4 style={{ margin: '0 0 1rem', fontSize: '1.05rem', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              📋 Tenant Eligibility & Rules
            </h4>
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
              {[
                { name: 'familyAllowed', label: '👨‍👩‍👧 Family Allowed', checked: form.familyAllowed },
                { name: 'bachelorAllowed', label: '🎓 Bachelor Allowed', checked: form.bachelorAllowed },
                { name: 'studentAllowed', label: '🎒 Students Allowed', checked: form.studentAllowed },
                { name: 'petsAllowed', label: '🐾 Pets Allowed', checked: form.petsAllowed },
                { name: 'smokingAllowed', label: '🚬 Smoking Allowed', checked: form.smokingAllowed }
              ].map(rule => (
                <label key={rule.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: 'var(--bg-surface)', padding: '0.5rem 1rem', borderRadius: '20px', border: `1px solid ${rule.checked ? '#22c55e' : '#d1d5db'}`, color: rule.checked ? '#15803d' : '#6b7280', fontWeight: 600, transition: 'all 0.2s', boxShadow: rule.checked ? '0 2px 4px rgba(34,197,94,0.1)' : 'none' }}>
                  <input
                    type="checkbox"
                    name={rule.name}
                    checked={rule.checked}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                  />
                  {rule.label}
                </label>
              ))}
            </div>
            <div style={{ marginTop: '1.25rem', width: '200px' }}>
              <label className="form-label" style={{ fontSize: '0.85rem', color: 'var(--success-text)', fontWeight: 600 }}>Min Lease (Months)</label>
              <input type="number" name="minLeaseDurationMonths" className="form-control" style={{ borderRadius: '6px', border: '1px solid var(--success-border)' }} min="1" value={form.minLeaseDurationMonths} onChange={handleChange} />
            </div>
          </div>
        </section>

        {/* --- SECTION 4: Location & Specs --- */}
        <section className="form-section" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            📍 Location & Specifications
          </h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Street Address *</label>
              <input type="text" name="address" className="form-control" style={{ borderRadius: '8px' }} placeholder="e.g. House 42, Road 11, Block D" value={form.address} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>City / Area *</label>
              <input type="text" name="city" className="form-control" style={{ borderRadius: '8px' }} placeholder="e.g. Banani, Dhaka" value={form.city} onChange={handleChange} required />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Specific Area</label>
              <input type="text" name="area" className="form-control" style={{ borderRadius: '8px' }} placeholder="e.g. Banani" value={form.area} onChange={handleChange} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Bedrooms</label>
              <input type="number" name="bedrooms" className="form-control" style={{ borderRadius: '8px' }} min="0" value={form.bedrooms} onChange={handleChange} />
            </div>
            <div>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Bathrooms</label>
              <input type="number" name="bathrooms" className="form-control" style={{ borderRadius: '8px' }} min="0" value={form.bathrooms} onChange={handleChange} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Amenities (Comma separated)</label>
              <input type="text" name="amenities" className="form-control" style={{ borderRadius: '8px' }} placeholder="Lift, Generator, Security, Gas, Balcony" value={form.amenities} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Property Description *</label>
            <textarea name="description" className="form-control" style={{ borderRadius: '8px', minHeight: '120px', resize: 'vertical' }} placeholder="Highlight the best features of your property..." value={form.description} onChange={handleChange} required />
          </div>
        </section>

        {/* --- SECTION 5: Media Gallery --- */}
        <section className="form-section">
          <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            📸 Photo Gallery
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Existing Photos Grid */}
            {existingImages.length > 0 && (
              <div style={{ background: 'var(--bg-subtle)', padding: '1rem', borderRadius: '12px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Currently Uploaded:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {existingImages.map((img) => (
                    <div key={img._id} style={{ position: 'relative', width: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: img.isPrimary ? '3px solid #3b82f6' : '1px solid #cbd5e1', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      <img src={getImageUrl(img.url)} alt="Property" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {img.isPrimary && (
                        <span style={{ position: 'absolute', top: 0, left: 0, background: '#3b82f6', color: 'white', fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700, borderBottomRightRadius: '6px' }}>
                          COVER
                        </span>
                      )}
                      <div style={{ position: 'absolute', bottom: '4px', right: '4px', display: 'flex', gap: '4px' }}>
                        {!img.isPrimary && (
                          <button type="button" onClick={() => handleSetPrimaryExisting(img._id)} style={{ background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '0.75rem', cursor: 'pointer', backdropFilter: 'blur(2px)' }} title="Set as Cover">★</button>
                        )}
                        <button type="button" onClick={() => handleDeleteExistingImage(img._id)} style={{ background: 'rgba(239,68,68,0.8)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 6px', fontSize: '0.75rem', cursor: 'pointer', backdropFilter: 'blur(2px)' }} title="Delete">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Previews */}
            {newPreviews.length > 0 && (
              <div style={{ background: 'var(--info-bg)', padding: '1rem', borderRadius: '12px', border: '1px dashed var(--info-border)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0284c7', marginBottom: '0.75rem' }}>Ready to Upload:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
                  {newPreviews.map((previewUrl, i) => (
                    <div key={i} style={{ position: 'relative', width: '120px', height: '90px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #38bdf8' }}>
                      <img src={previewUrl} alt="New preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => handleRemoveNewFile(i)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '24px', height: '24px', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            {existingImages.length + selectedFiles.length < 10 && (
              <div
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: '12px',
                  padding: '2rem',
                  textAlign: 'center',
                  background: 'var(--bg-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                onClick={() => document.getElementById('prop-images-input').click()}
              >
                <input id="prop-images-input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>Drag & Drop or Click to Upload Photos</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  {existingImages.length + selectedFiles.length} / 10 photos used. PNG, JPG, WEBP (Max 5MB)
                </div>
              </div>
            )}
          </div>
        </section>

        {/* --- FOOTER ACTIONS --- */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 0', borderTop: '2px solid var(--border-color)', marginTop: '1rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', background: form.isActive ? '#eff6ff' : '#f8fafc', padding: '0.75rem 1.25rem', borderRadius: '8px', border: `1px solid ${form.isActive ? '#bfdbfe' : '#e2e8f0'}` }}>
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
              style={{ width: '20px', height: '20px', accentColor: '#3b82f6' }}
            />
            <span style={{ fontWeight: 700, color: form.isActive ? '#1e40af' : '#64748b' }}>
              {form.isActive ? '👁️ Listed Publicly' : '🙈 Hidden from Search'}
            </span>
          </label>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading} style={{ borderRadius: '8px', padding: '0.75rem 1.5rem', fontWeight: 600 }}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading} style={{ borderRadius: '8px', padding: '0.75rem 2rem', fontWeight: 700, fontSize: '1.05rem', boxShadow: '0 4px 6px -1px rgba(59,130,246,0.5)' }}>
              {isEditing ? 'Save Changes' : '🚀 Publish Listing'}
            </Button>
          </div>
        </div>

      </form>
    </Modal>
  );
}
