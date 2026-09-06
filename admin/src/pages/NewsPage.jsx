import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import './NewsPage.css';

import { API } from '../config';
import { getImageUrl } from '../getImageUrl';
import ConfirmModal from '../components/ConfirmModal';

const emptyForm = { title: '', content: '', category: 'announcement' };

export default function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [newsList, setNewsList]   = useState([]);
  const [search, setSearch]       = useState('');
  const [form, setForm]           = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');
  const [imageFile, setImageFile] = useState(null);     
  const [preview, setPreview]     = useState(null);       
  const [currentImage, setCurrentImage] = useState(null); 

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchNews();
  }, []);

 
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearch(searchQuery);
      setSearchParams({}, { replace: true });
    }

  }, []);

  async function fetchNews() {
    try {
      const res = await axios.get(`${API}/api/admin/news`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewsList(res.data);
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
    setFormError('');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('content', form.content);
      formData.append('category', form.category);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (editingId) {
        await axios.put(`${API}/api/admin/news/${editingId}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        });
      } else {
        await axios.post(`${API}/api/admin/news`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        });
      }

      cancelForm();
      fetchNews();
    } catch (err) {
      console.log(err);
      setFormError(err.response?.data?.message || 'Failed to save news.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setForm({ title: item.title, content: item.content, category: item.category });
    setEditingId(item.id);
    setCurrentImage(item.image); 
    setImageFile(null);
    setPreview(null);
    setFormError('');
    setShowForm(true);
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setPreview(null);
    setCurrentImage(null);
    setFormError('');
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`${API}/api/admin/news/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: deleteReason.trim() },
      });
      setNewsList(prev => prev.filter(n => n.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteReason('');
    } catch (err) {
      console.log(err);
      setDeleteError(err.response?.data?.message || 'Failed to delete news.');
    } finally {
      setDeleting(false);
    }
  }

  const filteredNews = newsList.filter(n =>
    `${n.title} ${n.content}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="section-header">
        <h1>News</h1>
        <button className="btn-green" onClick={() => { setForm(emptyForm); setEditingId(null); setFormError(''); setShowForm(true); }}>
          + Add News
        </button>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search by title or content..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: '8px 10px', border: '1px solid #ccc', borderRadius: '6px', fontSize: '14px', width: '260px', outline: 'none' }}
        />
      </div>

      {/* News table */}
      <table>
        <thead>
          <tr>
            <th>News # </th>
            <th>Image</th>
            <th>Title</th>
            <th>Category</th>
            <th>Date Posted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredNews.length === 0 ? (
            <tr><td colSpan="6">{newsList.length === 0 ? 'No news posts yet.' : 'No news posts match your search.'}</td></tr>
          ) : (
            filteredNews.map(n => (
              <tr key={n.id}>
               
                <td>
                  {n.image ? (
                    <img
                      src={getImageUrl(n.image)}
                      alt="news"
                      className="table-thumbnail"
                    />
                  ) : (
                    <span style={{ color: '#aaa', fontSize: '12px' }}>No image</span>
                  )}
                </td>
                <td style={{ maxWidth: '260px' }}>{n.title}</td>
                <td>
                  <span className="badge" style={{ backgroundColor: '#f0f0f0', color: '#555' }}>
                    {n.category}
                  </span>
                </td>
                <td>{new Date(n.created_at).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-gray" onClick={() => startEdit(n)}>Edit</button>
                    <button className="btn-red" onClick={() => { setDeleteError(''); setDeleteReason(''); setDeleteTarget(n); }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Add/Edit news modal */}
      {showForm && (
        <div className="news-modal-overlay" onClick={cancelForm}>
          <div className="news-modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Edit News' : 'Add New Post'}</h2>
            <form onSubmit={handleSubmit}>
              {formError && <div className="error-msg">{formError}</div>}

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="News title"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  <option value="announcement">Announcement</option>
                  <option value="weather">Weather</option>
                  <option value="crime">Crime</option>
                  <option value="health">Health</option>
                  <option value="environment">Environment</option>
                </select>
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="Write the news content here..."
                  required
                  style={{ minHeight: '140px' }}
                />
              </div>

              {/* Image upload */}
              <div className="form-group">
                <label>
                  Image {editingId && currentImage && '— leave empty to keep current image'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />

                {/* Preview of newly selected image */}
                {preview && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>New image preview:</p>
                    <img src={preview} alt="preview" className="image-preview" />
                  </div>
                )}

                {/* Show existing image if editing and no new file picked */}
                {!preview && currentImage && (
                  <div style={{ marginTop: '10px' }}>
                    <p style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Current image:</p>
                    <img src={getImageUrl(currentImage)} alt="current" className="image-preview" />
                  </div>
                )}
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-green" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Post News'}
                </button>
                <button type="button" className="btn-gray" onClick={cancelForm} disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete this news post?"
        message={
          deleteError
            ? deleteError
            : deleteTarget
              ? `This will permanently delete "${deleteTarget.title}". This action cannot be undone.`
              : ''
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        requireReason
        reasonLabel="Reason for deletion (required)"
        reasonPlaceholder="e.g. Outdated, published in error, duplicate..."
        reasonValue={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); setDeleteReason(''); }}
      />
    </div>
  );
}