import { useEffect, useState } from 'react';
import axios from 'axios';
import './HotlinesPage.css';

const API = 'http://localhost:5000';

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
  const token = localStorage.getItem('token');

  useEffect(() => { fetchHotlines(); }, []);

  async function fetchHotlines() {
    try {
      const res = await axios.get(`${API}/api/hotlines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHotlines(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
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
      alert('Failed to save hotline.');
    }
  }

  function startEdit(item) {
    setForm({ name: item.name, number: item.number, category: item.category });
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo(0, 0);
  }

  function cancelForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  }

  async function deleteHotline(id) {
    if (!confirm('Delete this hotline?')) return;
    try {
      await axios.delete(`${API}/api/hotlines/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHotlines(prev => prev.filter(h => h.id !== id));
    } catch (err) {
      console.log(err);
      alert('Failed to delete hotline.');
    }
  }

  return (
    <div className="page">
      <div className="section-header">
        <h1>Emergency Hotlines</h1>
        {!showForm && (
          <button className="btn-green" onClick={() => setShowForm(true)}>
            + Add Hotline
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="hotline-form">
          <h2>{editingId ? 'Edit Hotline' : 'Add New Hotline'}</h2>
          <form onSubmit={handleSubmit}>
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
              <button type="submit" className="btn-green">
                {editingId ? 'Save Changes' : 'Add Hotline'}
              </button>
              <button type="button" className="btn-gray" onClick={cancelForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Number</th>
            <th>Category</th>
            <th>Date Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {hotlines.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', color: '#aaa' }}>No hotlines yet.</td></tr>
          ) : (
            hotlines.map(h => {
              const cc = categoryColors[h.category] || categoryColors.General;
              return (
                <tr key={h.id}>
                  <td>#{h.id}</td>
                  <td style={{ fontWeight: 600 }}>{h.name}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 14 }}>{h.number}</td>
                  <td>
                    <span className="badge" style={{ backgroundColor: cc.bg, color: cc.color }}>
                      {h.category}
                    </span>
                  </td>
                  <td>{new Date(h.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn-gray" onClick={() => startEdit(h)}>Edit</button>
                      <button className="btn-red" onClick={() => deleteHotline(h.id)}>Delete</button>
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