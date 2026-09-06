import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './HotlinesPage.css';

import { API } from '../config';
import ConfirmModal from '../components/ConfirmModal';
import { PhoneIcon } from '../components/Icons';

const emptyForm = { name: '', number: '', category: 'General' };

const CATEGORIES = ['Emergency', 'Medical', 'Police', 'Fire', 'Health', 'General'];

const categoryColors = {
  Emergency: { bg: '#FFEBEE', color: '#C0392B' },
  Medical:   { bg: '#FFEBEE', color: '#C0392B' },
  Police:    { bg: '#E3F2FD', color: '#1565C0' },
  Fire:      { bg: '#FFF3E0', color: '#E65100' },
  Health:    { bg: '#E8F5EE', color: '#1B8A4C' },
  General:   { bg: '#E1F5FE', color: '#0288D1' },
};

export default function HotlinesPage() {
  const [hotlines, setHotlines]   = useState([]);
  const [form, setForm]           = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const token = localStorage.getItem('token');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hotlines;
    return hotlines.filter(h =>
      h.name.toLowerCase().includes(q) ||
      h.number.toLowerCase().includes(q) ||
      h.category.toLowerCase().includes(q)
    );
  }, [hotlines, search]);

  useEffect(() => { fetchHotlines(); }, []);

  async function fetchHotlines() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/hotlines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHotlines(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`${API}/api/hotlines/${editingId}`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/api/hotlines`, form, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      cancelForm();
      fetchHotlines();
    } catch (err) {
      console.log(err);
      setFormError(err.response?.data?.message || 'Failed to save hotline.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setForm({ name: item.name, number: item.number, category: item.category });
    setEditingId(item.id);
    setFormError('');
    setShowForm(true);
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setFormError('');
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`${API}/api/hotlines/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: deleteReason.trim() },
      });
      setHotlines(prev => prev.filter(h => h.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteReason('');
    } catch (err) {
      console.log(err);
      setDeleteError(err.response?.data?.message || 'Failed to delete hotline.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="page hotlines-page">
      <div className="page-header-row">
        <div>
          <h1>Emergency Hotlines</h1>
          <p className="page-subtitle">Numbers residents see in the mobile app's emergency screen.</p>
        </div>
        <button className="btn-green" onClick={() => { setForm(emptyForm); setEditingId(null); setFormError(''); setShowForm(true); }}>
          + Add Hotline
        </button>
      </div>

      <div className="filter-pill-bar">
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Search by name, number, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="filter-pill-count">{filtered.length} hotline{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <table>
            <tbody>
              {[...Array(4)].map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td colSpan="5"><div className="skeleton-bar" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📞</div>
            <div className="empty-state-title">
              {hotlines.length === 0 ? 'No hotlines yet' : 'No hotlines match your search'}
            </div>
            <div className="empty-state-text">
              {hotlines.length === 0
                ? 'Add the first emergency number residents will see in the app.'
                : 'Try a different name, number, or category.'}
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Number</th>
                <th>Category</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => {
                const cc = categoryColors[h.category] || categoryColors.General;
                return (
                  <tr key={h.id}>
                    <td style={{ fontWeight: 600 }}>{h.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 14 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                        <PhoneIcon width={14} height={14} />
                        {h.number}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: cc.bg, color: cc.color }}>
                        {h.category}
                      </span>
                    </td>
                    <td>{new Date(h.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn-gray" onClick={() => startEdit(h)}>Edit</button>
                        <button
                          className="btn-gray"
                          style={{ color: 'var(--danger)', borderColor: 'var(--danger-border)' }}
                          onClick={() => { setDeleteError(''); setDeleteReason(''); setDeleteTarget(h); }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit hotline modal */}
      {showForm && (
        <div className="hotline-modal-overlay" onClick={cancelForm}>
          <div className="hotline-modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Hotline' : 'Add New Hotline'}</h2>
            <form onSubmit={handleSubmit}>
              {formError && <div className="error-msg">{formError}</div>}

              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. BFP, Police, MDRMMC"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Number</label>
                  <input
                    type="text"
                    value={form.number}
                    onChange={e => setForm({ ...form, number: e.target.value })}
                    placeholder="e.g. 09398129676"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-green" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Hotline'}
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
        title="Delete this hotline?"
        message={
          deleteError
            ? deleteError
            : deleteTarget
              ? `This will permanently delete "${deleteTarget.name}" (${deleteTarget.number}). This action cannot be undone.`
              : ''
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        requireReason
        reasonLabel="Reason for deletion (required)"
        reasonPlaceholder="e.g. Number decommissioned, duplicate entry..."
        reasonValue={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); setDeleteReason(''); }}
      />
    </div>
  );
}