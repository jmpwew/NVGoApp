import { useEffect, useState } from 'react';
import axios from 'axios';
import './NewsPage.css';

import { API } from '../config';
import { getImageUrl } from '../getImageUrl';

const emptyForm = { title: '', message: '', urgency: 'info', is_active: true };

const URGENCY_META = {
  info:      { label: 'Info',      bg: '#cfe2ff', color: '#084298' },
  warning:   { label: 'Warning',   bg: '#ffe8b3', color: '#935e00' },
  emergency: { label: 'Emergency', bg: '#f8d7da', color: '#842029' },
};

export default function AnnouncementsPage() {
  const [list, setList]           = useState([]);
  const [form, setForm]           = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview]     = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    try {
      const res = await axios.get(`${API}/api/admin/announcements`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setList(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('message', form.message);
      formData.append('urgency', form.urgency);
      formData.append('is_active', form.is_active);
      if (imageFile) formData.append('image', imageFile);

      if (editingId) {
        await axios.put(`${API}/api/admin/announcements/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API}/api/admin/announcements`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }

      cancelForm();
      fetchAnnouncements();
    } catch (err) {
      console.log(err);
      alert('Failed to save announcement.');
    }
  }

  function startEdit(item) {
    setForm({ title: item.title, message: item.message, urgency: item.urgency, is_active: item.is_active });
    setEditingId(item.id);
    setCurrentImage(item.image);
    setImageFile(null);
    setPreview(null);
    setShowForm(true);
    window.scrollTo(0, 0);
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setPreview(null);
    setCurrentImage(null);
  }

  async function deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`${API}/api/admin/announcements/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setList(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.log(err);
      alert('Failed to delete announcement.');
    }
  }

  return (
    <div className="page">
      <div className="section-header">
        <h1>Announcements</h1>
        {!showForm && (
          <button className="btn-green" onClick={() => setShowForm(true)}>
            + Add Announcement
          </button>
        )}
      </div>

      {showForm && (
        <div className="news-form">
          <h2>{editingId ? 'Edit Announcement' : 'Add New Announcement'}</h2>
          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Typhoon Warning for Nueva Valencia"
                required
              />
            </div>

            <div className="form-group">
              <label>Urgency</label>
              <select
                value={form.urgency}
                onChange={e => setForm({ ...form, urgency: e.target.value })}
              >
                <option value="info">Info — routine notice</option>
                <option value="warning">Warning — heads up, be cautious</option>
                <option value="emergency">Emergency — urgent, act now</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={form.message}
                onChange={e => setForm({ ...form, message: e.target.value })}
                placeholder="Write the full announcement here..."
                required
                style={{ minHeight: '140px' }}
              />
            </div>

            <div className="form-group">
              <label>
                Image {editingId && currentImage && '— leave empty to keep current image'}
              </label>
              <input type="file" accept="image/*" onChange={handleImageChange} />

              {preview && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>New image preview:</p>
                  <img src={preview} alt="preview" className="image-preview" />
                </div>
              )}
              {!preview && currentImage && (
                <div style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Current image:</p>
                  <img src={getImageUrl(currentImage)} alt="current" className="image-preview" />
                </div>
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="is_active"
                checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                style={{ width: 'auto' }}
              />
              <label htmlFor="is_active" style={{ margin: 0 }}>
                Active — visible in the app's Home screen carousel right now
              </label>
            </div>

            <div className="form-buttons">
              <button type="submit" className="btn-green">
                {editingId ? 'Save Changes' : 'Post Announcement'}
              </button>
              <button type="button" className="btn-gray" onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Image</th>
            <th>Title</th>
            <th>Urgency</th>
            <th>Status</th>
            <th>Date Posted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {list.length === 0 ? (
            <tr><td colSpan="7">No announcements yet.</td></tr>
          ) : (
            list.map(a => {
              const um = URGENCY_META[a.urgency] || URGENCY_META.info;
              return (
                <tr key={a.id}>
                  <td>{a.id}</td>
                  <td>
                    {a.image ? (
                      <img src={getImageUrl(a.image)} alt="announcement" className="table-thumbnail" />
                    ) : (
                      <span style={{ color: '#aaa', fontSize: '12px' }}>No image</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '260px' }}>{a.title}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: um.bg, color: um.color }}>
                      {um.label}
                    </span>
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        backgroundColor: a.is_active ? '#d1e7dd' : '#f0f0f0',
                        color: a.is_active ? '#0a3622' : '#777',
                      }}
                    >
                      {a.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>{new Date(a.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-gray" onClick={() => startEdit(a)}>Edit</button>
                      <button className="btn-red" onClick={() => deleteAnnouncement(a.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
