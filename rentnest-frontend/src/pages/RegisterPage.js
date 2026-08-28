// src/pages/RegisterPage.js
import { useForm } from 'react-hook-form';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function RegisterPage() {
  const { register, handleSubmit } = useForm();
  const { login } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setError('');
    try {
      // NO extra /api here because api baseURL already ends with /api
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,            // 'tenant' or 'landlord'
      });

      const { token, user } = res.data;
      login(token, user);          // save to context + localStorage

      // role-based redirect after sign up
      if (user.role === 'landlord') return nav('/landlord', { replace: true });
      if (user.role === 'tenant') return nav('/tenant', { replace: true });
      nav('/', { replace: true });
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        'Registration failed. This email might already be used.';
      setError(msg);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 520 }}>
      <h2 style={{ margin: '18px 0' }}>Create your account</h2>

      {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

      <form className="stack" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <div className="label">Full name</div>
          <input className="input" {...register('name', { required: true })} />
        </div>

        <div>
          <div className="label">Email</div>
          <input className="input" type="email" {...register('email', { required: true })} />
        </div>

        <div>
          <div className="label">Password</div>
          <input className="input" type="password" {...register('password', { required: true, minLength: 6 })} />
          <div className="hint">Minimum 6 characters</div>
        </div>

        <div>
          <div className="label">Role</div>
          <select className="input" {...register('role', { required: true })} defaultValue="tenant">
            <option value="tenant">Tenant</option>
            <option value="landlord">Landlord</option>
          </select>
        </div>

        <button className="btn" type="submit">Sign up</button>
      </form>

      <div style={{ marginTop: 16 }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </div>
    </div>
  );
}
