// src/pages/PropertiesPage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../context/ToastContext';
import { propertyService } from '../services/propertyService';
import PropertyCard from '../components/property/PropertyCard';
import PropertyFilters from '../components/property/PropertyFilters';
import PropertyCompareModal from '../components/property/PropertyCompareModal';
import { SkeletonPropertyCard } from '../components/common/Skeleton';
import EmptyState from '../components/common/EmptyState';
import BookingModal from '../components/booking/BookingModal';
import Button from '../components/common/Button';

export default function PropertiesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();
  const location = useLocation();

  const [properties, setProperties] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  // Compare system state
  const [comparedProperties, setComparedProperties] = useState([]);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Parse initial filters from URL query params
  const [filters, setFilters] = useState(() => {
    const params = new URLSearchParams(location.search);
    return {
      q: params.get('q') || undefined,
      city: params.get('city') || undefined,
      minRent: params.get('minRent') ? Number(params.get('minRent')) : undefined,
      maxRent: params.get('maxRent') ? Number(params.get('maxRent')) : undefined,
      bedrooms: params.get('bedrooms') ? Number(params.get('bedrooms')) : undefined,
      propertyType: params.get('propertyType') || undefined,
      status: params.get('status') || undefined,
      sort: params.get('sort') || 'newest',
      page: 1,
      limit: 12
    };
  });

  const [selectedPropForBooking, setSelectedPropForBooking] = useState(null);

  const loadProperties = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const data = await propertyService.list(params);
      setProperties(data.properties || []);
      setTotalCount(data.total || (data.properties ? data.properties.length : 0));
      setCurrentPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadWishlist = useCallback(async () => {
    if (!user || user.role !== 'tenant') return;
    try {
      const res = await api.get('/favorites/mine');
      const ids = new Set((res.data || []).map((item) => (typeof item === 'string' ? item : item._id)));
      setWishlistIds(ids);
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  useEffect(() => {
    loadProperties(filters);
  }, [loadProperties, filters]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const handleToggleFavorite = async (propertyId) => {
    if (!user) {
      toast.info('Please sign in to save properties');
      nav('/login');
      return;
    }
    if (user.role !== 'tenant') {
      toast.info('Wishlist is available for tenants');
      return;
    }

    const isFav = wishlistIds.has(propertyId);
    try {
      if (isFav) {
        await api.delete(`/favorites/${propertyId}`);
        setWishlistIds((prev) => {
          const next = new Set(prev);
          next.delete(propertyId);
          return next;
        });
        toast.info('Removed from saved properties');
      } else {
        await api.post(`/favorites/${propertyId}`);
        setWishlistIds((prev) => new Set([...prev, propertyId]));
        toast.success('Saved to wishlist');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update saved properties');
    }
  };

  const handleBookNow = (propertyId) => {
    if (!user) {
      toast.info('Please sign in to book a viewing');
      nav('/login', { state: { next: `/property/${propertyId}?book=1` } });
      return;
    }
    const prop = properties.find((p) => p._id === propertyId);
    if (prop && prop.owner && String(prop.owner._id || prop.owner) === String(user._id || user.id)) {
      toast.info('You cannot book a viewing for your own listing');
      return;
    }
    setSelectedPropForBooking(prop);
  };

  const handleToggleCompare = (property) => {
    setComparedProperties((prev) => {
      const exists = prev.some((p) => p._id === property._id);
      if (exists) {
        return prev.filter((p) => p._id !== property._id);
      }
      if (prev.length >= 3) {
        toast.info('You can compare up to 3 properties at a time');
        return prev;
      }
      return [...prev, property];
    });
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem 4rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, marginBottom: '0.5rem' }}>
          Explore Rental Properties
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem' }}>
          Discover verified apartments, duplexes, and residential homes across Bangladesh.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }} className="marketplace-layout">
        {/* Filter Sidebar */}
        <aside>
          <PropertyFilters
            filters={filters}
            onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))}
            onReset={() =>
              setFilters({
                q: undefined,
                city: undefined,
                minRent: undefined,
                maxRent: undefined,
                bedrooms: undefined,
                propertyType: undefined,
                status: undefined,
                sort: 'newest',
                page: 1,
                limit: 12
              })
            }
          />
        </aside>

        {/* Listings Grid */}
        <main>
          {/* Top Bar Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
              Showing <b style={{ color: 'var(--text-main)' }}>{properties.length}</b> of {totalCount} listings
            </div>

            {comparedProperties.length > 0 && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCompareModalOpen(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <span>⚖️ Compare Selected ({comparedProperties.length}/3)</span>
              </Button>
            )}
          </div>

          {loading ? (
            <div className="property-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonPropertyCard key={i} />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <EmptyState
              icon="🔍"
              title="No properties match your search"
              description="Try adjusting your budget, location, or room requirements to see more available listings."
              actionLabel="Clear All Filters"
              onAction={() =>
                setFilters({
                  q: undefined,
                  city: undefined,
                  minRent: undefined,
                  maxRent: undefined,
                  bedrooms: undefined,
                  propertyType: undefined,
                  status: undefined,
                  sort: 'newest',
                  page: 1,
                  limit: 12
                })
              }
            />
          ) : (
            <>
              <div className="property-grid">
                {properties.map((prop) => (
                  <PropertyCard
                    key={prop._id}
                    property={prop}
                    isFavorite={wishlistIds.has(prop._id)}
                    onToggleFavorite={handleToggleFavorite}
                    onBookNow={handleBookNow}
                    isComparing={comparedProperties.some((p) => p._id === prop._id)}
                    onToggleCompare={handleToggleCompare}
                  />
                ))}
              </div>

              {/* Pagination Bar */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '2.5rem' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    ← Previous
                  </Button>

                  <span style={{ fontSize: '0.9rem', fontWeight: 600, padding: '0 0.75rem', color: 'var(--text-secondary)' }}>
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Next →
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Booking Modal */}
      {selectedPropForBooking && (
        <BookingModal
          isOpen={!!selectedPropForBooking}
          onClose={() => setSelectedPropForBooking(null)}
          property={selectedPropForBooking}
          onSuccess={() => {
            setSelectedPropForBooking(null);
            toast.success('Tour booking request submitted successfully!');
          }}
        />
      )}

      {/* Compare Modal */}
      <PropertyCompareModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        properties={comparedProperties}
        onRemoveProperty={(id) => setComparedProperties((prev) => prev.filter((p) => p._id !== id))}
      />
    </div>
  );
}
