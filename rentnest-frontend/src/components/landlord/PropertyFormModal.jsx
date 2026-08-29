// src/components/landlord/PropertyFormModal.jsx
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
    rent: '',
    bedrooms: 1,
    bathrooms: 1,
    amenities: '',
    propertyType: 'apartment',
    status: 'available',
    isActive: true
  });

  const [existingImages, setExistingImages] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialProperty) {
      setForm({
        title: initialProperty.title || '',
        description: initialProperty.description || '',
        address: initialProperty.address || '',
        city: initialProperty.city || '',
        state: initialProperty.state || '',
        country: initialProperty.country || 'Bangladesh',
        rent: initialProperty.rent || '',
        bedrooms: initialProperty.bedrooms || 1,
        bathrooms: initialProperty.bathrooms || 1,
        amenities: Array.isArray(initialProperty.amenities)
          ? initialProperty.amenities.join(', ')
          : (initialProperty.amenities || ''),
        propertyType: initialProperty.propertyType || 'apartment',
        status: initialProperty.status || 'available',
        isActive: initialProperty.isActive !== false
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
        rent: '',
        bedrooms: 1,
        bathrooms: 1,
        amenities: '',
        propertyType: 'apartment',
        status: 'available',
        isActive: true
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
    if (validFiles.length < files.length) {
      toast.error('Some files were skipped because they are not valid images');
    }

    const totalAllowed = 10 - existingImages.length;
    const cappedFiles = validFiles.slice(0, totalAllowed);

    setSelectedFiles((prev) => [...prev, ...cappedFiles]);
    const previews = cappedFiles.map((file) => URL.createObjectURL(file));
    setNewPreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveNewFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!initialProperty) return;
    try {
      await propertyService.deleteImage(initialProperty._id, imageId);
      setExistingImages((prev) => prev.filter((img) => img._id !== imageId));
      toast.success('Photo removed');
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Could not delete image');
    }
  };

  const handleSetPrimary = async (imageId) => {
    if (!initialProperty) return;
    try {
      await propertyService.setPrimaryImage(initialProperty._id, imageId);
      setExistingImages((prev) =>
        prev.map((img) => ({
          ...img,
          isPrimary: img._id === imageId
        }))
      );
      toast.success('Primary photo updated');
      if (onSuccess) onSuccess();
    } catch {
      toast.error('Could not update primary photo');
    }
  };

  // Real-time completeness score calculation
  const calculateLiveScore = () => {
    let score = 0;
    if (form.title.trim().length >= 10) score += 10;
    else if (form.title.trim().length > 0) score += 5;

    if (form.description.trim().length >= 50) score += 20;
    else if (form.description.trim().length >= 20) score += 10;

    if (form.address.trim() && form.city.trim() && form.state.trim()) score += 15;
    else if (form.city.trim()) score += 8;

    if (Number(form.rent) > 0 && Number(form.bedrooms) > 0 && Number(form.bathrooms) > 0) score += 15;

    const amList = form.amenities.split(',').map((s) => s.trim()).filter(Boolean);
    if (amList.length >= 3) score += 15;
    else if (amList.length >= 1) score += 8;

    const totalImages = existingImages.length + selectedFiles.length;
    if (totalImages >= 5) score += 25;
    else if (totalImages >= 3) score += 18;
    else if (totalImages >= 1) score += 10;

    return Math.min(100, Math.max(0, score));
  };

  const liveScore = calculateLiveScore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.rent || !form.address || !form.city) {
      toast.error('Please fill in all required fields (Title, Rent, Address, City)');
      return;
    }

    if (Number(form.rent) < 0) {
      toast.error('Rent cannot be a negative amount');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('title', form.title.trim());
    formData.append('description', form.description.trim());
    formData.append('address', form.address.trim());
    formData.append('city', form.city.trim());
    formData.append('state', form.state.trim());
    formData.append('country', form.country.trim());
    formData.append('rent', Number(form.rent));
    formData.append('bedrooms', Number(form.bedrooms));
    formData.append('bathrooms', Number(form.bathrooms));
    formData.append('amenities', form.amenities);
    formData.append('propertyType', form.propertyType);
    formData.append('status', form.status);
    formData.append('isActive', form.isActive);

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
      title={isEditing ? 'Edit Property Listing' : 'List a New Property'}
      maxWidth="780px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Listing Completeness Meter */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>
              Listing Completeness: {liveScore}%
            </span>
            <span style={{ fontSize: '0.8rem', color: liveScore >= 80 ? 'var(--success-text)' : 'var(--text-secondary)' }}>
              {liveScore >= 80 ? '✓ Excellent listing quality' : 'Add more details & photos to improve rank'}
            </span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${liveScore}%`,
                height: '100%',
                backgroundColor: liveScore >= 80 ? 'var(--success)' : liveScore >= 50 ? 'var(--warning)' : 'var(--primary)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <label className="form-label" style={{ fontWeight: 600 }}>Property Title *</label>
          <input
            type="text"
            name="title"
            className="form-control"
            placeholder="e.g. Modern Luxury 3-Bedroom Apartment in Gulshan 2"
            value={form.title}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Property Type</label>
            <select
              name="propertyType"
              className="form-control"
              value={form.propertyType}
              onChange={handleChange}
            >
              <option value="apartment">Apartment / Flat</option>
              <option value="house">Independent House / Duplex</option>
              <option value="studio">Studio Apartment</option>
              <option value="villa">Luxury Villa</option>
              <option value="room">Single Room / Sublet</option>
              <option value="commercial">Commercial Space</option>
            </select>
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Monthly Rent (৳ BDT) *</label>
            <input
              type="number"
              name="rent"
              className="form-control"
              placeholder="e.g. 35000"
              min="0"
              value={form.rent}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Status</label>
            <select
              name="status"
              className="form-control"
              value={form.status}
              onChange={handleChange}
            >
              <option value="available">Available Now</option>
              <option value="reserved">Reserved / Under Application</option>
              <option value="rented">Currently Rented</option>
              <option value="pending_review">Draft / Pending Review</option>
            </select>
          </div>
        </div>

        {/* Location Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Street Address *</label>
            <input
              type="text"
              name="address"
              className="form-control"
              placeholder="e.g. House 42, Road 11, Block D"
              value={form.address}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>City / Area *</label>
            <input
              type="text"
              name="city"
              className="form-control"
              placeholder="e.g. Banani, Dhaka"
              value={form.city}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>State / District</label>
            <input
              type="text"
              name="state"
              className="form-control"
              placeholder="e.g. Dhaka"
              value={form.state}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Specs & Amenities */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '1rem' }}>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Bedrooms</label>
            <input
              type="number"
              name="bedrooms"
              className="form-control"
              min="0"
              value={form.bedrooms}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Bathrooms</label>
            <input
              type="number"
              name="bathrooms"
              className="form-control"
              min="0"
              value={form.bathrooms}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>Amenities (comma-separated)</label>
            <input
              type="text"
              name="amenities"
              className="form-control"
              placeholder="e.g. Lift, Generator, Security, WiFi, Parking"
              value={form.amenities}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="form-label" style={{ fontWeight: 600 }}>Detailed Description *</label>
          <textarea
            name="description"
            className="form-control"
            rows="4"
            placeholder="Describe the unit layout, nearby transit, sunlight, security, utility arrangements, and tenant preferences..."
            value={form.description}
            onChange={handleChange}
            required
          />
        </div>

        {/* Photo Upload System */}
        <div>
          <label className="form-label" style={{ fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>Property Photos (Up to 10 photos)</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {existingImages.length + selectedFiles.length} / 10 photos
            </span>
          </label>

          {/* Existing Photos Grid */}
          {existingImages.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Current Saved Photos:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {existingImages.map((img) => (
                  <div
                    key={img._id}
                    style={{
                      position: 'relative',
                      width: '100px',
                      height: '75px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: img.isPrimary ? '2px solid var(--primary)' : '1px solid var(--border-color)'
                    }}
                  >
                    <img
                      src={getImageUrl(img.url)}
                      alt="Property"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {img.isPrimary && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '2px',
                          left: '2px',
                          backgroundColor: 'var(--primary)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          padding: '1px 4px',
                          borderRadius: '2px'
                        }}
                      >
                        Primary
                      </span>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        display: 'flex',
                        gap: '2px'
                      }}
                    >
                      {!img.isPrimary && (
                        <button
                          type="button"
                          onClick={() => handleSetPrimary(img._id)}
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: '#fbbf24',
                            border: 'none',
                            borderRadius: '3px',
                            padding: '2px 4px',
                            fontSize: '0.7rem',
                            cursor: 'pointer'
                          }}
                          title="Set as Primary"
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteExistingImage(img._id)}
                        style={{
                          backgroundColor: 'rgba(239, 68, 68, 0.85)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '3px',
                          padding: '2px 4px',
                          fontSize: '0.7rem',
                          cursor: 'pointer'
                        }}
                        title="Delete photo"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Selected Files Previews */}
          {newPreviews.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                New Photos to Upload:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {newPreviews.map((previewUrl, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      width: '100px',
                      height: '75px',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--primary)'
                    }}
                  >
                    <img
                      src={previewUrl}
                      alt="New preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewFile(i)}
                      style={{
                        position: 'absolute',
                        top: '2px',
                        right: '2px',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '18px',
                        height: '18px',
                        fontSize: '0.65rem',
                        cursor: 'pointer'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* File Input */}
          {existingImages.length + selectedFiles.length < 10 && (
            <div
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                textAlign: 'center',
                backgroundColor: 'var(--bg-subtle)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('prop-images-input').click()}
            >
              <input
                id="prop-images-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>📁</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Click to upload property photos</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                PNG, JPG, WEBP up to 5MB each (Exterior, Living room, Bedrooms, Kitchen, Bathrooms)
              </div>
            </div>
          )}
        </div>

        {/* Published Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <input
            type="checkbox"
            id="isActiveToggle"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
          />
          <label htmlFor="isActiveToggle" style={{ fontSize: '0.925rem', fontWeight: 600, cursor: 'pointer' }}>
            List publicly in search results (Active listing)
          </label>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing ? 'Save Changes' : 'Publish Property'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
