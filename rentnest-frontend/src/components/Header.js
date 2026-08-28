// src/components/Header.js
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="brand">RentNest</Link>
        <nav className="nav">
          {!user ? (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              {user.role === 'admin' && <Link to="/admin">Admin Panel</Link>}
              {user.role === 'landlord' && (
                <Link to="/landlord">My dashboard</Link>
              )}
              {user.role === 'tenant' && (
                <Link to="/tenant">My dashboard</Link>
              )}
              <button
                onClick={() => {
                  logout();
                  nav('/');
                }}
                className="signout-btn"
              >
                Sign out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
