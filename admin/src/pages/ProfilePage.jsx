import { useRef, useState } from 'react';
import axios from 'axios';
import './ProfilePage.css';

import { API } from '../config';
import { getImageUrl } from '../getImageUrl';
import {
  MapPinIcon, ShieldIcon, CheckCircleIcon,
} from '../components/Icons';


function CameraIcon(props) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

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
  admin:    'Administrator',
  verifier: 'Verifier',
  police:   'Police',
  bfp:      'BFP (Fire)',
  medical:  'Medical / Ambulance',
};

const ROLE_BADGE_CLASSES = {
  admin:    'badge-admin',
  verifier: 'badge-verifier',
  police:   'badge-office-police',
  bfp:      'badge-office-bfp',
  medical:  'badge-office-medical',
};

const ROLE_BANNER_CLASSES = {
  admin:    'banner-admin',
  verifier: 'banner-verifier',
  police:   'banner-police',
  bfp:      'banner-bfp',
  medical:  'banner-medical',
};

export default function ProfilePage() {
  const token = localStorage.getItem('token');
  const stored = (() => {
    try { return JSON.parse(localStorage.getItem('admin')) || {}; }
    catch { return {}; }
  })();

  const [form, setForm] = useState({
    firstname: stored.firstname || '',
    lastname:  stored.lastname  || '',
    email:     stored.email     || '',
    contact:   stored.contact   || '',
    address:   stored.address   || '',
  });
  const [editing, setEditing]         = useState(false);
  const [imageFile, setImageFile]     = useState(null);
  const [preview, setPreview]         = useState(null);
  const [currentImage, setCurrentImage] = useState(stored.image || null);
  const [saving, setSaving]           = useState(false);
  const [message, setMessage]         = useState(null); 

  const [pwForm, setPwForm]           = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwSaving, setPwSaving]       = useState(false);
  const [pwMessage, setPwMessage]     = useState(null); 
  const [changingPw, setChangingPw]   = useState(false);

  const fileInputRef = useRef(null);
  const role = stored.role;

  const fullName = `${form.firstname} ${form.lastname}`.trim() || 'Admin User';
  const initials = (fullName || form.email || 'Admin')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  function cancelEdit() {
    setForm({
      firstname: stored.firstname || '',
      lastname:  stored.lastname  || '',
      email:     stored.email     || '',
      contact:   stored.contact   || '',
      address:   stored.address   || '',
    });
    setImageFile(null);
    setPreview(null);
    setMessage(null);
    setEditing(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('firstname', form.firstname);
      formData.append('lastname', form.lastname);
      formData.append('email', form.email);
      formData.append('contact', form.contact);
      formData.append('address', form.address);
      if (imageFile) formData.append('image', imageFile);

      const res = await axios.put(`${API}/api/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      const updated = res.data.user;
      localStorage.setItem('admin', JSON.stringify(updated));
      setCurrentImage(updated.image);
      setImageFile(null);
      setPreview(null);
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setEditing(false);
    } catch (err) {
      console.log(err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
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
      <h1>My Profile</h1>

      <div className="profile-layout">
        {/* ── Left: identity card ─────────────────────────────── */}
        <div className="card profile-identity-card">
          <div className={`profile-banner ${ROLE_BANNER_CLASSES[role] || 'banner-admin'}`} />

          <div className="profile-avatar-wrap">
            {preview ? (
              <img src={preview} alt="preview" className="profile-avatar-lg" />
            ) : currentImage ? (
              <img src={getImageUrl(currentImage)} alt="profile" className="profile-avatar-lg" />
            ) : (
              <div className="profile-avatar-lg profile-avatar-fallback">{initials}</div>
            )}
            {editing && (
              <button
                type="button"
                className="avatar-edit-btn"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile photo"
              >
                <CameraIcon />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              hidden
            />
          </div>

          <div className="profile-identity-body">
            <div className="profile-name">{fullName}</div>
            <div className={`badge ${ROLE_BADGE_CLASSES[role] || 'badge-admin'} profile-role-badge`}>
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
              <h2>Personal Information</h2>
              <p>Keep your account details accurate and up to date.</p>
            </div>
            {!editing && (
              <button type="button" className="btn-outline" onClick={() => setEditing(true)}>
                <PencilIcon /> Edit profile
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
              <div className="profile-view-field">
                <label>First name</label>
                <div className="profile-view-value">{form.firstname || '—'}</div>
              </div>
              <div className="profile-view-field">
                <label>Last name</label>
                <div className="profile-view-value">{form.lastname || '—'}</div>
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
              <div className="profile-form-grid">
                <div className="form-group">
                  <label>First name</label>
                  <input
                    type="text"
                    value={form.firstname}
                    onChange={e => setForm({ ...form, firstname: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last name</label>
                  <input
                    type="text"
                    value={form.lastname}
                    onChange={e => setForm({ ...form, lastname: e.target.value })}
                    required
                  />
                </div>
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

              <div className="form-group">
                <label>Profile photo</label>
                <input type="file" accept="image/*" onChange={handleImageChange} />
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
            <p>Change the password used to sign in to this account.</p>
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