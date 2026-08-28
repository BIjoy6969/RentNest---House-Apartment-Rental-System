// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import Header from './components/Header';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PropertyDetails from './pages/PropertyDetails';
import TenantDashboard from './pages/TenantDashboard';
import LandlordDashboard from './pages/LandlordDashboard';
import AdminPanel from './pages/AdminPanel';
import BookingPage from './pages/BookingPage';   // ✅ Added import
import RequireAdmin from './components/RequireAdmin';

import { AuthProvider, useAuth } from './AuthContext';

function RequireAuth({ children, role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/property/:id" element={<PropertyDetails />} />

          {/* ✅ Booking route */}
          <Route path="/booking/:id" element={
            <RequireAuth role="tenant"><BookingPage /></RequireAuth>
          } />

          {/* Tenant */}
          <Route path="/tenant" element={
            <RequireAuth role="tenant"><TenantDashboard /></RequireAuth>
          }/>

          {/* Landlord */}
          <Route path="/landlord" element={
            <RequireAuth role="landlord"><LandlordDashboard /></RequireAuth>
          }/>

          {/* Admin */}
          <Route path="/admin" element={
            <RequireAdmin><AdminPanel /></RequireAdmin>
          }/>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
