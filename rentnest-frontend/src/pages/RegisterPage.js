// src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'tenant' }
  });
  const { login } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');

  const selectedRole = watch('role', 'tenant');
  const password = watch('password');

  const onSubmit = async (data) => {
    setRegisterError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        role: data.role // strictly 'tenant' or 'landlord'
      });

      const { token, user } = res.data;
      login(token, user);
      toast.success(`Account created! Welcome, ${user.name}`);

      if (user.role === 'landlord') {
        nav('/landlord', { replace: true });
      } else {
        nav('/tenant', { replace: true });
      }
    } catch (err) {
      const msg = err?.response?.data?.message || (err?.response?.status === 500 ? 'Server connection error. Please try again in a moment.' : 'Registration failed. Please check your details.');
      setRegisterError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - var(--header-height) - 150px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-xl)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>Create Your Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem' }}>
            Join RentNest to discover verified listings or list your rental properties
          </p>
        </div>

        {registerError && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--danger-text)',
              fontSize: '0.875rem',
              marginBottom: '1.25rem'
            }}
          >
            ⚠️ {registerError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {/* Role Selection Tabs */}
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
              I want to register as:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${selectedRole === 'tenant' ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: selectedRole === 'tenant' ? 'var(--primary-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <input
                  type="radio"
                  value="tenant"
                  {...register('role')}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🛋️</span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: selectedRole === 'tenant' ? 'var(--primary)' : 'var(--text-main)' }}>
                  Tenant / Renter
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Find and tour homes</span>
              </label>

              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1rem',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${selectedRole === 'landlord' ? 'var(--primary)' : 'var(--border-color)'}`,
                  backgroundColor: selectedRole === 'landlord' ? 'var(--primary-light)' : 'var(--bg-surface)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)'
                }}
              >
                <input
                  type="radio"
                  value="landlord"
                  {...register('role')}
                  style={{ display: 'none' }}
                />
                <span style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🏢</span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: selectedRole === 'landlord' ? 'var(--primary)' : 'var(--text-main)' }}>
                  Landlord / Owner
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>List and manage properties</span>
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Alex Johnson"
              {...register('name', { required: 'Full name is required', minLength: { value: 2, message: 'Name too short' } })}
            />
            {errors.name && <span className="form-error">{errors.name.message}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@example.com"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
              })}
            />
            {errors.email && <span className="form-error">{errors.email.message}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="At least 6 characters"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' }
              })}
            />
            {errors.password && <span className="form-error">{errors.password.message}</span>}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Confirm your password"
              {...register('confirmPassword', {
                required: 'Please confirm password',
                validate: (val) => val === password || 'Passwords do not match'
              })}
            />
            {errors.confirmPassword && <span className="form-error">{errors.confirmPassword.message}</span>}
          </div>

          <Button type="submit" variant="primary" size="lg" loading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            Create Account
          </Button>
        </form>

        <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
