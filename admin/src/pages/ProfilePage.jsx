import { useState } from 'react';
import axios from 'axios';
import './ProfilePage.css';

import { API } from '../config';
import { getImageUrl } from '../getImageUrl';

const ROLE_LABELS = {
  admin:    'Administrator',
  verifier: 'Verifier',
  police:   'Police',
  bfp:      'BFP (Fire)',
  medical:  'Medical / Ambulance',
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
  const [imageFile, setImageFile]     = useState(null);
  const [preview, setPreview]         = useState(null);
  const [currentImage, setCurrentImage] = useState(stored.image || null);
  const [saving, setSaving]           = useState(false);
  const [message, setMessage]         = useState(null); // { type: 'success'|'error', text }

  const initials = (`${form.firstname} ${form.lastname}`.trim() || form.email || 'Admin')
    .split(' ')
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
    } catch (err) {
      console.log(err);
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>My Profile</h1>

      <div className="card profile-card">
        <div className="profile-avatar-block">
          {preview ? (
            <img src={preview} alt="preview" className="profile-avatar-lg" />
          ) : currentImage ? (
            <img src={getImageUrl(currentImage)} alt="profile" className="profile-avatar-lg" />
          ) : (
            <div className="profile-avatar-lg profile-avatar-fallback">{initials}</div>
          )}

          <div>
            <div className="profile-name">{`${form.firstname} ${form.lastname}`.trim() || 'Admin User'}</div>
            <div className="profile-role badge badge-admin">{ROLE_LABELS[stored.role] || stored.role || 'Staff'}</div>
          </div>
        </div>

        {message && (
          <div className={`profile-message profile-message-${message.type}`}>
            {message.text}
          </div>
        )}

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
            <button type="submit" className="btn-green" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
