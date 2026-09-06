import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';

import { API } from '../config';

function EyeIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 11 8 11 8a17.94 17.94 0 0 1-2.35 3.19M6.61 6.61A17.94 17.94 0 0 0 1 13s4 8 11 8a10.44 10.44 0 0 0 5.39-1.61" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function MailIcon(props) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 6-10 7L2 6" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function AlertIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function PinMark(props) {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2C7.6 2 4 5.6 4 10c0 6 8 12 8 12s8-6 8-12c0-4.4-3.6-8-8-8Zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      const { token, user } = res.data;

      // Only staff roles may use this panel (not regular mobile app users)
      const allowedRoles = ['admin', 'verifier', 'police', 'bfp', 'medical'];
      if (!allowedRoles.includes(user.role)) {
        setError('You do not have access to this system.');
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('admin', JSON.stringify(user));

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/dashboard');
      } else if (user.role === 'verifier') {
        navigate('/verifier');
      } else {
        // office roles: police | bfp | medical
        navigate('/office');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">

        {/* Branding side */}
        <div className="login-brand">
          <div className="login-brand-pattern" aria-hidden="true" />
          <div className="login-brand-content">
            <div className="brand-mark">
              <PinMark />
              <span>NVGo</span>
            </div>
            <h2>Emergency &amp; Incident Reporting</h2>
            <p>Municipality of Nueva Valencia, Guimaras</p>

            <ul className="brand-roles">
              <li><span className="role-dot role-dot--verifier" />Verifiers review incoming reports</li>
              <li><span className="role-dot role-dot--responder" />Police, BFP &amp; medical respond in the field</li>
              <li><span className="role-dot role-dot--admin" />Admins oversee the full system</li>
            </ul>
          </div>
        </div>

        {/* Form side */}
        <div className="login-form-side">
          <div className="login-box">
            <h1>Staff Sign In</h1>
            <p className="login-subtitle">Use your assigned NVGo staff account</p>

            {error && (
              <div className="error-msg" role="alert">
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
              <div className="form-group">
                <label htmlFor="login-email">Email</label>
                <div className="input-wrap">
                  <MailIcon className="input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@nuevavalencia.gov.ph"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="login-password">Password</label>
                <div className="input-wrap">
                  <LockIcon className="input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-green login-submit" disabled={loading}>
                {loading && <span className="spinner" aria-hidden="true" />}
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="login-footnote">
              Trouble signing in? Contact your NVGo system administrator.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}