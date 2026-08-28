// src/pages/LoginPage.js
import { useForm } from 'react-hook-form';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function LoginPage() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setError('');
    try {
      // IMPORTANT: no extra /api here because baseURL already ends with /api
      const res = await api.post('/auth/login', data);
      const { token, user } = res.data;

      // Save to context + localStorage
      login(token, user);

      // If a "next" was provided (e.g., from Book Now), go there
      const next = loc.state?.next;
      if (next) return nav(next, { replace: true });

      // Role-based redirect
      if (user.role === 'landlord') return nav('/landlord', { replace: true });
      if (user.role === 'tenant') return nav('/tenant', { replace: true });
      if (user.role === 'admin') return nav('/admin', { replace: true });
      // Fallback
      nav('/', { replace: true });
    } catch (e) {
      const msg = e?.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 460 }}>
      <h2 style={{ margin: '18px 0' }}>Sign in</h2>

      {loc.state?.next && (
        <div className="notice" style={{ marginBottom: 12 }}>
          Please sign in to continue.
        </div>
      )}

      {error && (
        <div className="error" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}

      <form className="stack" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <div className="label">Email</div>
          <input className="input" type="email" {...register('email', { required: true })} />
        </div>
        <div>
          <div className="label">Password</div>
          <input className="input" type="password" {...register('password', { required: true })} />
        </div>
        <button className="btn" type="submit">Sign in</button>
      </form>

      <div style={{ marginTop: 16 }}>
        New here? <Link to="/register">Create an account</Link>
      </div>
    </div>
  );
}
