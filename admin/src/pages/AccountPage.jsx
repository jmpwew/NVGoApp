import { useState } from 'react';
import axios from 'axios';
import './ProfilePage.css'; // reuses the same card/layout styles as ProfilePage

import { API } from '../config';
import {
  MapPinIcon, ShieldIcon, CheckCircleIcon,
} from '../components/Icons';

// Account Settings page for shared office/desk logins: verifier, police,
// bfp, medical. Unlike ProfilePage.jsx (admin, an individual account), these
// roles share ONE login per office, so there's no personal name or photo —
// just an office/unit name, contact info, and password.

function MailIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m3 6 9 7 9-7" />
    </svg>
  );
}

function PhoneIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
    </svg>
  );
}

function PencilIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4Z" />
    </svg>
  );
}

function LockIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

const ROLE_LABELS = {
  verifier: 'Verifier',
  police:   'Police',
  bfp:      'BFP (Fire)',
  medical:  'Medical / Ambulance',
};

const ROLE_BADGE_CLASSES = {
  verifier: 'badge-verifier',
  police:   'badge-office-police',
  bfp:      'badge-office-bfp',
  medical:  'badge-office-medical',
};

const ROLE_BANNER_CLASSES = {
  verifier: 'banner-verifier',
  police:   'banner-police',
  bfp:      'banner-bfp',
  medical:  'banner-medical',
};

export default function AccountPage() {
  const token = localStorage.getItem('token');
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem('admin')) || {}; }
    catch { return {}; }
  })();

  const role = stored.role;

  // "firstname" doubles as the office/unit display name for these shared
  // accounts (e.g. "Cabuyao Police Station"); "lastname" is unused.
  const [form, setForm] = useState({
    officeName: stored.firstname || '',
    email:      stored.email     || '',
    contact:    stored.contact   || '',
    address:    stored.address   || '',
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }

  const [pwForm, setPwForm]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving]     = useState(false);
  const [pwMessage, setPwMessage]   = useState(null); // { type, text }
  const [changingPw, setChangingPw] = useState(false);

  const displayName = form.officeName.trim() || 'Office Account';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function cancelEdit() {
    setForm({
      officeName: stored.firstname || '',
      email:      stored.email     || '',
      contact:    stored.contact   || '',
      address:    stored.address   || '',
    });
    setMessage(null);
    setEditing(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('firstname', form.officeName);
      formData.append('lastname', ''); // unused for shared office accounts
      formData.append('email', form.email);
      formData.append('contact', form.contact);
      formData.append('address', form.address);

      const res = await axios.put(`${API}/api/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      const updated = res.data.user;
      localStorage.setItem('admin', JSON.stringify(updated));
      setMessage({ type: 'success', text: 'Account info updated successfully.' });
      setEditing(false);
    } catch (err) {
      console.log(err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update account info.' });
    } finally {
      setSaving(false);
    }
  }

  function cancelPwEdit() {
    setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setPwMessage(null);
    setChangingPw(false);
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setPwMessage(null);

    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwMessage({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    if (pwForm.newPassword.length < 8 || !/[a-zA-Z]/.test(pwForm.newPassword) || !/[0-9]/.test(pwForm.newPassword)) {
      setPwMessage({ type: 'error', text: 'Password must be at least 8 characters and include a letter and a number.' });
      return;
    }

    setPwSaving(true);
    try {
      await axios.put(`${API}/api/auth/password/change-password`, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPwMessage({ type: 'success', text: 'Password changed successfully.' });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setChangingPw(false);
    } catch (err) {
      console.log(err);
      setPwMessage({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPwSaving(false);
    }
  }

  return (
    <div className="page profile-page">
      <h1>Account Settings</h1>

      <div className="profile-layout">
        {/* ── Left: identity card ─────────────────────────────── */}
        <div className="card profile-identity-card">
          <div className={`profile-banner ${ROLE_BANNER_CLASSES[role] || 'banner-verifier'}`} />

          <div className="profile-avatar-wrap">
            {/* Shared office/desk accounts don't represent one person, so
                there's no photo — always the initials avatar. */}
            <div className="profile-avatar-lg profile-avatar-fallback">{initials}</div>
          </div>

          <div className="profile-identity-body">
            <div className="profile-name">{displayName}</div>
            <div className={`badge ${ROLE_BADGE_CLASSES[role] || 'badge-verifier'} profile-role-badge`}>
              <ShieldIcon width={12} height={12} /> {ROLE_LABELS[role] || role || 'Staff'}
            </div>

            <div className="profile-status">
              <CheckCircleIcon width={14} height={14} />
              <span>Active account</span>
            </div>

            <div className="profile-quickinfo">
              <div className="profile-quickinfo-row">
                <MailIcon />
                <span>{form.email || '—'}</span>
              </div>
              <div className="profile-quickinfo-row">
                <PhoneIcon />
                <span>{form.contact || 'No contact number'}</span>
              </div>
              <div className="profile-quickinfo-row">
                <MapPinIcon />
                <span>{form.address || 'No address on file'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: editable details ─────────────────────────── */}
        <div className="card profile-details-card">
          <div className="profile-details-header">
            <div>
              <h2>Office Information</h2>
              <p>Keep this office&rsquo;s contact details accurate and up to date.</p>
            </div>
            {!editing && (
              <button type="button" className="btn-outline" onClick={() => setEditing(true)}>
                <PencilIcon /> Edit info
              </button>
            )}
          </div>

          {message && (
            <div className={`profile-message profile-message-${message.type}`}>
              {message.text}
            </div>
          )}

          {!editing ? (
            <div className="profile-view-grid">
              <div className="profile-view-field profile-view-field-wide">
                <label>Office / unit name</label>
                <div className="profile-view-value">{form.officeName || '—'}</div>
              </div>
              <div className="profile-view-field profile-view-field-wide">
                <label>Email address</label>
                <div className="profile-view-value">{form.email || '—'}</div>
              </div>
              <div className="profile-view-field">
                <label>Contact number</label>
                <div className="profile-view-value">{form.contact || '—'}</div>
              </div>
              <div className="profile-view-field">
                <label>Address</label>
                <div className="profile-view-value">{form.address || '—'}</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Office / unit name</label>
                <input
                  type="text"
                  value={form.officeName}
                  onChange={e => setForm({ ...form, officeName: e.target.value })}
                  placeholder="e.g. Cabuyao Police Station"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="profile-form-grid">
                <div className="form-group">
                  <label>Contact number</label>
                  <input
                    type="text"
                    value={form.contact}
                    onChange={e => setForm({ ...form, contact: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-buttons">
                <button type="button" className="btn-outline" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn-green" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ── Security: password change ────────────────────────── */}
      <div className="card profile-security-card">
        <div className="profile-details-header">
          <div>
            <h2><LockIcon /> Password &amp; Security</h2>
            <p>Change the password used to sign in to this office account.</p>
          </div>
          {!changingPw && (
            <button type="button" className="btn-outline" onClick={() => setChangingPw(true)}>
              Change password
            </button>
          )}
        </div>

        {pwMessage && (
          <div className={`profile-message profile-message-${pwMessage.type}`}>
            {pwMessage.text}
          </div>
        )}

        {changingPw && (
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label>Current password</label>
              <input
                type="password"
                value={pwForm.currentPassword}
                onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="profile-form-grid">
              <div className="form-group">
                <label>New password</label>
                <input
                  type="password"
                  value={pwForm.newPassword}
                  onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm new password</label>
                <input
                  type="password"
                  value={pwForm.confirmPassword}
                  onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <p className="profile-field-hint">
              At least 8 characters, including a letter and a number.
            </p>

            <div className="form-buttons">
              <button type="button" className="btn-outline" onClick={cancelPwEdit} disabled={pwSaving}>
                Cancel
              </button>
              <button type="submit" className="btn-green" disabled={pwSaving}>
                {pwSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
