// src/pages/TenantDashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { useToast } from '../context/ToastContext';
import TenantOverview from '../components/tenant/TenantOverview';
import TenantBookings from '../components/tenant/TenantBookings';
import TenantApplications from '../components/tenant/TenantApplications';
import TenantDecisions from '../components/tenant/TenantDecisions';
import TenantWishlist from '../components/tenant/TenantWishlist';
import TenantProfile from '../components/tenant/TenantProfile';
import BookingModal from '../components/booking/BookingModal';
import ChatBox from '../components/messaging/ChatBox';

export default function TenantDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'bookings' | 'decisions' | 'applications' | 'wishlist' | 'profile'
  const [bookings, setBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [chatInfo, setChatInfo] = useState(null); // { propertyId, withUserId, peerName }
  const [selectedPropForBooking, setSelectedPropForBooking] = useState(null);

  const loadData = useCallback(async () => {
    if (!user || user.role !== 'tenant') return;
    setLoading(true);
    try {
      const [bookRes, appRes, favRes] = await Promise.allSettled([
        api.get('/bookings/mine'),
        api.get('/applications/mine'),
        api.get('/favorites/mine', { params: { populated: 1 } })
      ]);

      if (bookRes.status === 'fulfilled') setBookings(bookRes.value.data || []);
      if (appRes.status === 'fulfilled') setApplications(appRes.value.data || []);
      if (favRes.status === 'fulfilled') setWishlist(favRes.value.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleFavorite = async (propertyId) => {
    try {
      await api.delete(`/favorites/${propertyId}`);
      setWishlist((prev) => prev.filter((p) => p._id !== propertyId));
      toast.info('Removed from saved properties');
    } catch {
      toast.error('Could not update saved properties');
    }
  };

  const handleOpenChat = (propertyId, withUserId, peerName) => {
    setChatInfo({ propertyId, withUserId, peerName });
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem' }}>
      {/* Top Header */}
      <div className="dashboard-header">
        <div>
          <span className="section-kicker">Tenant Portal</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Welcome, {user?.name || 'Tenant'}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage your rental journey — viewings, two-sided decisions, and digital applications
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📅 Tour Bookings ({bookings.length})
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'decisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          🤝 Tour Decisions
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📝 Applications ({applications.length})
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'wishlist' ? 'active' : ''}`}
          onClick={() => setActiveTab('wishlist')}
        >
          ❤️ Saved Properties ({wishlist.length})
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          ⚙️ Rental Preferences & Profile
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <TenantOverview
          user={user}
          bookings={bookings}
          applications={applications}
          wishlist={wishlist}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {activeTab === 'bookings' && (
        <TenantBookings
          bookings={bookings}
          loading={loading}
          onRefresh={loadData}
          onOpenChat={handleOpenChat}
        />
      )}

      {activeTab === 'decisions' && (
        <TenantDecisions
          bookings={bookings}
          onRefresh={loadData}
          onOpenChat={handleOpenChat}
        />
      )}

      {activeTab === 'applications' && (
        <TenantApplications
          applications={applications}
          loading={loading}
          onOpenChat={handleOpenChat}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'wishlist' && (
        <TenantWishlist
          wishlist={wishlist}
          loading={loading}
          onToggleFavorite={handleToggleFavorite}
          onBookNow={(id) => {
            const prop = wishlist.find((p) => p._id === id);
            if (prop) setSelectedPropForBooking(prop);
          }}
        />
      )}

      {activeTab === 'profile' && (
        <TenantProfile user={user} onProfileUpdated={loadData} />
      )}

      {/* Chat Modal */}
      {chatInfo && (
        <ChatBox
          propertyId={chatInfo.propertyId}
          withUserId={chatInfo.withUserId}
          peerName={chatInfo.peerName || 'Landlord'}
          onClose={() => setChatInfo(null)}
        />
      )}

      {/* Booking Modal */}
      {selectedPropForBooking && (
        <BookingModal
          isOpen={!!selectedPropForBooking}
          property={selectedPropForBooking}
          onClose={() => setSelectedPropForBooking(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
