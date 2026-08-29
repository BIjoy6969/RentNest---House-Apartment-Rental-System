// src/pages/LandlordDashboard.js
import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import LandlordOverview from '../components/landlord/LandlordOverview';
import LandlordProperties from '../components/landlord/LandlordProperties';
import LandlordBookings from '../components/landlord/LandlordBookings';
import LandlordApplications from '../components/landlord/LandlordApplications';
import LandlordDecisions from '../components/landlord/LandlordDecisions';
import LandlordProfile from '../components/landlord/LandlordProfile';
import PropertyFormModal from '../components/landlord/PropertyFormModal';
import ChatBox from '../components/messaging/ChatBox';

export default function LandlordDashboard() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'properties' | 'bookings' | 'decisions' | 'applications' | 'profile'
  const [properties, setProperties] = useState([]);
  const [incomingBookings, setIncomingBookings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [propertyModalOpen, setPropertyModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [chatInfo, setChatInfo] = useState(null);

  const loadData = useCallback(async () => {
    if (!user || user.role !== 'landlord') return;
    setLoading(true);
    try {
      const [propRes, bookRes, appRes] = await Promise.allSettled([
        api.get('/properties/mine/list'),
        api.get('/bookings/incoming'),
        api.get('/applications/mine')
      ]);

      if (propRes.status === 'fulfilled') setProperties(propRes.value.data || []);
      if (bookRes.status === 'fulfilled') setIncomingBookings(bookRes.value.data || []);
      if (appRes.status === 'fulfilled') setApplications(appRes.value.data || []);
    } catch (e) {
      console.error('Failed to load landlord data', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAddProperty = () => {
    setEditingProperty(null);
    setPropertyModalOpen(true);
  };

  const handleOpenEditProperty = (prop) => {
    setEditingProperty(prop);
    setPropertyModalOpen(true);
  };

  const handleOpenChat = (propertyId, withUserId, peerName) => {
    setChatInfo({ propertyId, withUserId, peerName });
  };

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem 4rem' }}>
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <span className="section-kicker">Landlord Portal</span>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800 }}>Welcome, {user?.name || 'Landlord'}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Manage listings, review tour requests, track tenant tour feedback, and screen applicants
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview & Trust Score
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          🏢 My Listings ({properties.length})
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📅 Tour Requests ({incomingBookings.length})
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'decisions' ? 'active' : ''}`}
          onClick={() => setActiveTab('decisions')}
        >
          🤝 Tenant Tour Feedback
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📝 Applications ({applications.length})
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          ⚙️ Profile
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <LandlordOverview
          user={user}
          properties={properties}
          bookings={incomingBookings}
          applications={applications}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onAddProperty={handleOpenAddProperty}
        />
      )}

      {activeTab === 'properties' && (
        <LandlordProperties
          properties={properties}
          loading={loading}
          onAddProperty={handleOpenAddProperty}
          onEditProperty={handleOpenEditProperty}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'bookings' && (
        <LandlordBookings
          bookings={incomingBookings}
          loading={loading}
          onRefresh={loadData}
          onOpenChat={handleOpenChat}
        />
      )}

      {activeTab === 'decisions' && (
        <LandlordDecisions
          onOpenChat={handleOpenChat}
        />
      )}

      {activeTab === 'applications' && (
        <LandlordApplications
          applications={applications}
          loading={loading}
          onRefresh={loadData}
          onOpenChat={handleOpenChat}
        />
      )}

      {activeTab === 'profile' && (
        <LandlordProfile user={user} onProfileUpdated={loadData} />
      )}

      {/* Property Form Modal (Add / Edit) */}
      <PropertyFormModal
        isOpen={propertyModalOpen}
        onClose={() => setPropertyModalOpen(false)}
        initialProperty={editingProperty}
        onSuccess={loadData}
      />

      {/* Chat Modal */}
      {chatInfo && (
        <ChatBox
          propertyId={chatInfo.propertyId}
          withUserId={chatInfo.withUserId}
          peerName={chatInfo.peerName || 'Tenant'}
          onClose={() => setChatInfo(null)}
        />
      )}
    </div>
  );
}
