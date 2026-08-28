// src/components/RequireAdmin.js
import { useAuth } from '../AuthContext';
import { Navigate } from 'react-router-dom';

export default function RequireAdmin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
