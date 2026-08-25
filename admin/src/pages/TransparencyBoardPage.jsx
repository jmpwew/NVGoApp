import { useEffect, useState } from 'react';
import axios from 'axios';
import './TransparencyBoardPage.css';

import { API } from '../config';
import { getImageUrl } from '../getImageUrl';
import ConfirmModal from '../components/ConfirmModal';

const emptyBoardForm = {
  lgu_name: '',
  reporting_period: '',
  total_budget: '',
  budget_spent: '',
  budget_remaining: '',
  is_published: false,
};

const emptyInfraForm = { name: '', status: 'ongoing', cost: '' };
const emptyAccompForm = { title: '', description: '' };

function formatCurrency(value) {
  const num = Number(value || 0);
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TransparencyBoardPage() {
  const token = localStorage.getItem('token');

  // ---- board (budget) state ----
  const [boardForm, setBoardForm] = useState(emptyBoardForm);
  const [boardSaving, setBoardSaving] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [boardSaved, setBoardSaved] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- infrastructure state ----
  const [infrastructure, setInfrastructure] = useState([]);
  const [infraForm, setInfraForm] = useState(emptyInfraForm);
  const [infraEditingId, setInfraEditingId] = useState(null);
  const [infraShowForm, setInfraShowForm] = useState(false);
  const [infraImageFile, setInfraImageFile] = useState(null);
  const [infraPreview, setInfraPreview] = useState(null);
  const [infraSaving, setInfraSaving] = useState(false);
  const [infraError, setInfraError] = useState('');
  const [infraDeleteTarget, setInfraDeleteTarget] = useState(null);
  const [infraDeleting, setInfraDeleting] = useState(false);

  // ---- accomplishments state ----
  const [accomplishments, setAccomplishments] = useState([]);
  const [accompForm, setAccompForm] = useState(emptyAccompForm);
  const [accompEditingId, setAccompEditingId] = useState(null);
  const [accompShowForm, setAccompShowForm] = useState(false);
  const [accompImageFile, setAccompImageFile] = useState(null);
  const [accompPreview, setAccompPreview] = useState(null);
  const [accompSaving, setAccompSaving] = useState(false);
  const [accompError, setAccompError] = useState('');
  const [accompDeleteTarget, setAccompDeleteTarget] = useState(null);
  const [accompDeleting, setAccompDeleting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/transparency/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { board, infrastructure, accomplishments } = res.data;
      setBoardForm({
        lgu_name: board?.lgu_name || '',
        reporting_period: board?.reporting_period || '',
        total_budget: board?.total_budget ?? '',
        budget_spent: board?.budget_spent ?? '',
        budget_remaining: board?.budget_remaining ?? '',
        is_published: !!board?.is_published,
      });
      setUpdatedAt(board?.updated_at || null);
      setInfrastructure(infrastructure || []);
      setAccomplishments(accomplishments || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  // ---------------- BOARD (budget) ----------------

  async function handleBoardSubmit(e) {
    e.preventDefault();
    setBoardError('');
    setBoardSaved(false);
    setBoardSaving(true);
    try {
      const res = await axios.put(`${API}/api/transparency`, boardForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUpdatedAt(res.data.updated_at);
      setBoardSaved(true);
      setTimeout(() => setBoardSaved(false), 3000);
    } catch (err) {
      console.log(err);
      setBoardError(err.response?.data?.message || 'Failed to save the transparency board.');
    } finally {
      setBoardSaving(false);
    }
  }

  // ---------------- INFRASTRUCTURE ----------------

  function handleInfraImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setInfraImageFile(file);
    setInfraPreview(URL.createObjectURL(file));
  }

  function startInfraEdit(item) {
    setInfraForm({ name: item.name, status: item.status, cost: item.cost ?? '' });
    setInfraEditingId(item.id);
    setInfraImageFile(null);
    setInfraPreview(item.image ? getImageUrl(item.image) : null);
    setInfraError('');
    setInfraShowForm(true);
  }

  function cancelInfraForm() {
    setInfraForm(emptyInfraForm);
    setInfraEditingId(null);
    setInfraImageFile(null);
    setInfraPreview(null);
    setInfraShowForm(false);
    setInfraError('');
    setInfraSaving(false);
  }

  async function handleInfraSubmit(e) {
    e.preventDefault();
    setInfraError('');
    setInfraSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', infraForm.name);
      formData.append('status', infraForm.status);
      formData.append('cost', infraForm.cost);
      if (infraImageFile) formData.append('image', infraImageFile);

      if (infraEditingId) {
        await axios.put(`${API}/api/transparency/infrastructure/${infraEditingId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API}/api/transparency/infrastructure`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      cancelInfraForm();
      fetchAll();
    } catch (err) {
      console.log(err);
      setInfraError(err.response?.data?.message || 'Failed to save infrastructure item.');
    } finally {
      setInfraSaving(false);
    }
  }

  async function confirmInfraDelete() {
    if (!infraDeleteTarget) return;
    setInfraDeleting(true);
    try {
      await axios.delete(`${API}/api/transparency/infrastructure/${infraDeleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInfrastructure(prev => prev.filter(i => i.id !== infraDeleteTarget.id));
      setInfraDeleteTarget(null);
    } catch (err) {
      console.log(err);
    } finally {
      setInfraDeleting(false);
    }
  }

  // ---------------- ACCOMPLISHMENTS ----------------

  function handleAccompImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAccompImageFile(file);
    setAccompPreview(URL.createObjectURL(file));
  }

  function startAccompEdit(item) {
    setAccompForm({ title: item.title, description: item.description || '' });
    setAccompEditingId(item.id);
    setAccompImageFile(null);
    setAccompPreview(item.image ? getImageUrl(item.image) : null);
    setAccompError('');
    setAccompShowForm(true);
  }

  function cancelAccompForm() {
    setAccompForm(emptyAccompForm);
    setAccompEditingId(null);
    setAccompImageFile(null);
    setAccompPreview(null);
    setAccompShowForm(false);
    setAccompError('');
    setAccompSaving(false);
  }

  async function handleAccompSubmit(e) {
    e.preventDefault();
    setAccompError('');
    setAccompSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', accompForm.title);
      formData.append('description', accompForm.description);
      if (accompImageFile) formData.append('image', accompImageFile);

      if (accompEditingId) {
        await axios.put(`${API}/api/transparency/accomplishments/${accompEditingId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API}/api/transparency/accomplishments`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      cancelAccompForm();
      fetchAll();
    } catch (err) {
      console.log(err);
      setAccompError(err.response?.data?.message || 'Failed to save accomplishment.');
    } finally {
      setAccompSaving(false);
    }
  }

  async function confirmAccompDelete() {
    if (!accompDeleteTarget) return;
    setAccompDeleting(true);
    try {
      await axios.delete(`${API}/api/transparency/accomplishments/${accompDeleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccomplishments(prev => prev.filter(a => a.id !== accompDeleteTarget.id));
      setAccompDeleteTarget(null);
    } catch (err) {
      console.log(err);
    } finally {
      setAccompDeleting(false);
    }
  }

  if (loading) {
    return <div className="page"><p>Loading transparency board...</p></div>;
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1>Transparency Board</h1>
          <p className="page-subtitle">
            Public budget, infrastructure, and accomplishment report shown in the NVGo app.
            {updatedAt && <> Last updated {new Date(updatedAt).toLocaleString()}.</>}
          </p>
        </div>
        <span
          className="badge"
          style={boardForm.is_published
            ? { backgroundColor: '#E8F5EE', color: '#1B8A4C' }
            : { backgroundColor: '#F2F2F2', color: '#888' }}
        >
          {boardForm.is_published ? 'Published' : 'Not Published'}
        </span>
      </div>

      {/* ---------------- BUDGET FORM ---------------- */}
      <div className="tb-card">
        <h2 className="tb-card-title">LGU & Budget Summary</h2>
        <form onSubmit={handleBoardSubmit}>
          {boardError && <div className="error-msg">{boardError}</div>}

          <div className="form-row">
            <div className="form-group">
              <label>LGU Name</label>
              <input
                type="text"
                value={boardForm.lgu_name}
                onChange={e => setBoardForm({ ...boardForm, lgu_name: e.target.value })}
                placeholder="e.g. Nueva Valencia, Guimaras"
                required
              />
            </div>
            <div className="form-group">
              <label>Reporting Period</label>
              <input
                type="text"
                value={boardForm.reporting_period}
                onChange={e => setBoardForm({ ...boardForm, reporting_period: e.target.value })}
                placeholder="e.g. FY 2026 or Q3 2026"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Total Budget (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={boardForm.total_budget}
                onChange={e => setBoardForm({ ...boardForm, total_budget: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Budget Spent (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={boardForm.budget_spent}
                onChange={e => setBoardForm({ ...boardForm, budget_spent: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Budget Remaining (₱)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={boardForm.budget_remaining}
                onChange={e => setBoardForm({ ...boardForm, budget_remaining: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <label className="tb-toggle-row">
            <input
              type="checkbox"
              checked={boardForm.is_published}
              onChange={e => setBoardForm({ ...boardForm, is_published: e.target.checked })}
            />
            <span>Publish this board to the mobile app</span>
          </label>

          <div className="form-buttons">
            <button type="submit" className="btn-green" disabled={boardSaving}>
              {boardSaving ? 'Saving...' : 'Save Budget Summary'}
            </button>
            {boardSaved && <span className="tb-saved-msg">Saved ✓</span>}
          </div>
        </form>
      </div>

      {/* ---------------- INFRASTRUCTURE ---------------- */}
      <div className="tb-card">
        <div className="section-header">
          <h2 className="tb-card-title">Infrastructure Projects</h2>
          <button
            className="btn-green"
            onClick={() => { setInfraForm(emptyInfraForm); setInfraEditingId(null); setInfraImageFile(null); setInfraPreview(null); setInfraError(''); setInfraShowForm(true); }}
          >
            + Add Project
          </button>
        </div>

        {infrastructure.length === 0 ? (
          <p className="tb-empty">No infrastructure projects added yet.</p>
        ) : (
          <div className="tb-item-grid">
            {infrastructure.map(item => (
              <div className="tb-item-card" key={item.id}>
                {item.image ? (
                  <img src={getImageUrl(item.image)} alt={item.name} className="tb-item-img" />
                ) : (
                  <div className="tb-item-img tb-item-img-empty" />
                )}
                <div className="tb-item-body">
                  <span
                    className="badge"
                    style={item.status === 'completed'
                      ? { backgroundColor: '#E8F5EE', color: '#1B8A4C' }
                      : { backgroundColor: '#FFF3E0', color: '#E65100' }}
                  >
                    {item.status === 'completed' ? 'Completed' : 'Ongoing'}
                  </span>
                  <h3>{item.name}</h3>
                  {item.cost != null && item.cost !== '' && (
                    <p className="tb-item-cost">{formatCurrency(item.cost)}</p>
                  )}
                  <div className="tb-item-actions">
                    <button className="btn-gray" onClick={() => startInfraEdit(item)}>Edit</button>
                    <button className="btn-red" onClick={() => setInfraDeleteTarget(item)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---------------- ACCOMPLISHMENTS ---------------- */}
      <div className="tb-card">
        <div className="section-header">
          <h2 className="tb-card-title">Accomplishments</h2>
          <button
            className="btn-green"
            onClick={() => { setAccompForm(emptyAccompForm); setAccompEditingId(null); setAccompImageFile(null); setAccompPreview(null); setAccompError(''); setAccompShowForm(true); }}
          >
            + Add Accomplishment
          </button>
        </div>

        {accomplishments.length === 0 ? (
          <p className="tb-empty">No accomplishments added yet.</p>
        ) : (
          <div className="tb-item-grid">
            {accomplishments.map(item => (
              <div className="tb-item-card" key={item.id}>
                {item.image ? (
                  <img src={getImageUrl(item.image)} alt={item.title} className="tb-item-img" />
                ) : (
                  <div className="tb-item-img tb-item-img-empty" />
                )}
                <div className="tb-item-body">
                  <h3>{item.title}</h3>
                  {item.description && <p className="tb-item-desc">{item.description}</p>}
                  <div className="tb-item-actions">
                    <button className="btn-gray" onClick={() => startAccompEdit(item)}>Edit</button>
                    <button className="btn-red" onClick={() => setAccompDeleteTarget(item)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Infrastructure add/edit modal ---- */}
      {infraShowForm && (
        <div className="tb-modal-overlay" onClick={cancelInfraForm}>
          <div className="tb-modal" onClick={e => e.stopPropagation()}>
            <h2>{infraEditingId ? 'Edit Infrastructure Project' : 'Add Infrastructure Project'}</h2>
            <form onSubmit={handleInfraSubmit}>
              {infraError && <div className="error-msg">{infraError}</div>}

              <div className="form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  value={infraForm.name}
                  onChange={e => setInfraForm({ ...infraForm, name: e.target.value })}
                  placeholder="e.g. Barangay Road Concreting"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={infraForm.status}
                    onChange={e => setInfraForm({ ...infraForm, status: e.target.value })}
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cost (₱, optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={infraForm.cost}
                    onChange={e => setInfraForm({ ...infraForm, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Photo (optional)</label>
                <input type="file" accept="image/*" onChange={handleInfraImageChange} />
                {infraPreview && <img src={infraPreview} alt="Preview" className="tb-form-preview" />}
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-green" disabled={infraSaving}>
                  {infraSaving ? 'Saving...' : infraEditingId ? 'Save Changes' : 'Add Project'}
                </button>
                <button type="button" className="btn-gray" onClick={cancelInfraForm} disabled={infraSaving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Accomplishment add/edit modal ---- */}
      {accompShowForm && (
        <div className="tb-modal-overlay" onClick={cancelAccompForm}>
          <div className="tb-modal" onClick={e => e.stopPropagation()}>
            <h2>{accompEditingId ? 'Edit Accomplishment' : 'Add Accomplishment'}</h2>
            <form onSubmit={handleAccompSubmit}>
              {accompError && <div className="error-msg">{accompError}</div>}

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={accompForm.title}
                  onChange={e => setAccompForm({ ...accompForm, title: e.target.value })}
                  placeholder="e.g. 500 Households Assisted Under Relief Program"
                  required
                />
              </div>

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={accompForm.description}
                  onChange={e => setAccompForm({ ...accompForm, description: e.target.value })}
                  placeholder="Short description of the accomplishment"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>Photo (optional)</label>
                <input type="file" accept="image/*" onChange={handleAccompImageChange} />
                {accompPreview && <img src={accompPreview} alt="Preview" className="tb-form-preview" />}
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-green" disabled={accompSaving}>
                  {accompSaving ? 'Saving...' : accompEditingId ? 'Save Changes' : 'Add Accomplishment'}
                </button>
                <button type="button" className="btn-gray" onClick={cancelAccompForm} disabled={accompSaving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Delete confirmations ---- */}
      <ConfirmModal
        open={!!infraDeleteTarget}
        title="Delete this infrastructure project?"
        message={infraDeleteTarget ? `This will permanently remove "${infraDeleteTarget.name}" from the transparency board.` : ''}
        confirmLabel="Delete"
        tone="danger"
        loading={infraDeleting}
        onConfirm={confirmInfraDelete}
        onCancel={() => setInfraDeleteTarget(null)}
      />
      <ConfirmModal
        open={!!accompDeleteTarget}
        title="Delete this accomplishment?"
        message={accompDeleteTarget ? `This will permanently remove "${accompDeleteTarget.title}" from the transparency board.` : ''}
        confirmLabel="Delete"
        tone="danger"
        loading={accompDeleting}
        onConfirm={confirmAccompDelete}
        onCancel={() => setAccompDeleteTarget(null)}
      />
    </div>
  );
}
