import { useEffect, useState } from 'react';
import axios from 'axios';
import './TransparencyBoardPage.css';

import { API } from '../config';
import { getImageUrl } from '../getImageUrl';
import ConfirmModal from '../components/ConfirmModal';

const emptyBoardForm = {
  lgu_name: '',
  reporting_period: '',
  official_name: '',
  official_position: '',
  data_as_of: '',
  source_note: '',
  is_published: false,
};

const emptyInfraForm = {
  name: '', status: 'ongoing', cost: '',
  category: '', barangay: '', progress_percent: '', target_completion_date: '',
};
const emptyAccompForm = { title: '', description: '', category: '' };
const emptyDocForm = { title: '' };
const emptySectionForm = { title: '', content: '', is_published: true };

const CATEGORY_OPTIONS = [
  'Infrastructure', 'Health', 'Education', 'Disaster Response',
  'Livelihood', 'Peace & Order', 'Social Services', 'Environment', 'Other',
];

function formatCurrency(value) {
  const num = Number(value || 0);
  return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TransparencyBoardPage() {
  const token = localStorage.getItem('token');

  // ---- board (header) state ----
  const [boardForm, setBoardForm] = useState(emptyBoardForm);
  const [boardSaving, setBoardSaving] = useState(false);
  const [boardError, setBoardError] = useState('');
  const [boardSaved, setBoardSaved] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---- fund breakdown state ----
  const [funds, setFunds] = useState([]);
  const [fundsSaving, setFundsSaving] = useState(false);
  const [fundsSaved, setFundsSaved] = useState(false);
  const [fundsError, setFundsError] = useState('');

  // ---- documents state ----
  const [documents, setDocuments] = useState([]);
  const [docForm, setDocForm] = useState(emptyDocForm);
  const [docFile, setDocFile] = useState(null);
  const [docShowForm, setDocShowForm] = useState(false);
  const [docSaving, setDocSaving] = useState(false);
  const [docError, setDocError] = useState('');
  const [docDeleteTarget, setDocDeleteTarget] = useState(null);
  const [docDeleting, setDocDeleting] = useState(false);

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
  const [infraStatusFilter, setInfraStatusFilter] = useState('all');
  const [infraCategoryFilter, setInfraCategoryFilter] = useState('all');

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
  const [accompCategoryFilter, setAccompCategoryFilter] = useState('all');

  // ---- more (custom sections) state ----
  const [sections, setSections] = useState([]);
  const [sectionForm, setSectionForm] = useState(emptySectionForm);
  const [sectionEditingId, setSectionEditingId] = useState(null);
  const [sectionShowForm, setSectionShowForm] = useState(false);
  const [sectionImageFile, setSectionImageFile] = useState(null);
  const [sectionPreview, setSectionPreview] = useState(null);
  const [sectionSaving, setSectionSaving] = useState(false);
  const [sectionError, setSectionError] = useState('');
  const [sectionDeleteTarget, setSectionDeleteTarget] = useState(null);
  const [sectionDeleting, setSectionDeleting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/transparency/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { board, funds, infrastructure, accomplishments, documents, sections } = res.data;
      setBoardForm({
        lgu_name: board?.lgu_name || '',
        reporting_period: board?.reporting_period || '',
        official_name: board?.official_name || '',
        official_position: board?.official_position || '',
        data_as_of: board?.data_as_of ? board.data_as_of.slice(0, 10) : '',
        source_note: board?.source_note || '',
        is_published: !!board?.is_published,
      });
      setUpdatedAt(board?.updated_at || null);
      setFunds(funds || []);
      setInfrastructure(infrastructure || []);
      setAccomplishments(accomplishments || []);
      setDocuments(documents || []);
      setSections(sections || []);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  // ---------------- BOARD (header) ----------------

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

  // ---------------- FUNDS ----------------

  function updateFundField(fundType, field, value) {
    setFunds(prev => prev.map(f => f.fund_type === fundType ? { ...f, [field]: value } : f));
  }

  async function handleFundsSubmit(e) {
    e.preventDefault();
    setFundsError('');
    setFundsSaved(false);
    setFundsSaving(true);
    try {
      const res = await axios.put(`${API}/api/transparency/funds`, { funds }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFunds(res.data);
      setFundsSaved(true);
      setTimeout(() => setFundsSaved(false), 3000);
    } catch (err) {
      console.log(err);
      setFundsError(err.response?.data?.message || 'Failed to save the fund breakdown.');
    } finally {
      setFundsSaving(false);
    }
  }

  const fundTotals = funds.reduce((acc, f) => ({
    allocated: acc.allocated + Number(f.allocated || 0),
    spent: acc.spent + Number(f.spent || 0),
    remaining: acc.remaining + Number(f.remaining || 0),
  }), { allocated: 0, spent: 0, remaining: 0 });

  // ---------------- DOCUMENTS ----------------

  function cancelDocForm() {
    setDocForm(emptyDocForm);
    setDocFile(null);
    setDocShowForm(false);
    setDocError('');
    setDocSaving(false);
  }

  async function handleDocSubmit(e) {
    e.preventDefault();
    setDocError('');
    if (!docFile) { setDocError('Please choose a file to upload.'); return; }
    setDocSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', docForm.title);
      formData.append('file', docFile);
      await axios.post(`${API}/api/transparency/documents`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      cancelDocForm();
      fetchAll();
    } catch (err) {
      console.log(err);
      setDocError(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setDocSaving(false);
    }
  }

  async function confirmDocDelete() {
    if (!docDeleteTarget) return;
    setDocDeleting(true);
    try {
      await axios.delete(`${API}/api/transparency/documents/${docDeleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDocuments(prev => prev.filter(d => d.id !== docDeleteTarget.id));
      setDocDeleteTarget(null);
    } catch (err) {
      console.log(err);
    } finally {
      setDocDeleting(false);
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
    setInfraForm({
      name: item.name,
      status: item.status,
      cost: item.cost ?? '',
      category: item.category || '',
      barangay: item.barangay || '',
      progress_percent: item.progress_percent ?? '',
      target_completion_date: item.target_completion_date ? item.target_completion_date.slice(0, 10) : '',
    });
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
      formData.append('category', infraForm.category);
      formData.append('barangay', infraForm.barangay);
      formData.append('progress_percent', infraForm.progress_percent);
      formData.append('target_completion_date', infraForm.target_completion_date);
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

  const filteredInfrastructure = infrastructure.filter(item => {
    if (infraStatusFilter !== 'all' && item.status !== infraStatusFilter) return false;
    if (infraCategoryFilter !== 'all' && item.category !== infraCategoryFilter) return false;
    return true;
  });

  // ---------------- ACCOMPLISHMENTS ----------------

  function handleAccompImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setAccompImageFile(file);
    setAccompPreview(URL.createObjectURL(file));
  }

  function startAccompEdit(item) {
    setAccompForm({ title: item.title, description: item.description || '', category: item.category || '' });
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
      formData.append('category', accompForm.category);
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

  const filteredAccomplishments = accomplishments.filter(item => {
    if (accompCategoryFilter !== 'all' && item.category !== accompCategoryFilter) return false;
    return true;
  });

  // ---------------- MORE (custom sections) ----------------

  function handleSectionImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setSectionImageFile(file);
    setSectionPreview(URL.createObjectURL(file));
  }

  function startSectionEdit(item) {
    setSectionForm({ title: item.title, content: item.content || '', is_published: !!item.is_published });
    setSectionEditingId(item.id);
    setSectionImageFile(null);
    setSectionPreview(item.image ? getImageUrl(item.image) : null);
    setSectionError('');
    setSectionShowForm(true);
  }

  function cancelSectionForm() {
    setSectionForm(emptySectionForm);
    setSectionEditingId(null);
    setSectionImageFile(null);
    setSectionPreview(null);
    setSectionShowForm(false);
    setSectionError('');
    setSectionSaving(false);
  }

  async function handleSectionSubmit(e) {
    e.preventDefault();
    setSectionError('');
    setSectionSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', sectionForm.title);
      formData.append('content', sectionForm.content);
      formData.append('is_published', sectionForm.is_published);
      if (sectionImageFile) formData.append('image', sectionImageFile);

      if (sectionEditingId) {
        await axios.put(`${API}/api/transparency/sections/${sectionEditingId}`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${API}/api/transparency/sections`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      cancelSectionForm();
      fetchAll();
    } catch (err) {
      console.log(err);
      setSectionError(err.response?.data?.message || 'Failed to save this section.');
    } finally {
      setSectionSaving(false);
    }
  }

  async function confirmSectionDelete() {
    if (!sectionDeleteTarget) return;
    setSectionDeleting(true);
    try {
      await axios.delete(`${API}/api/transparency/sections/${sectionDeleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(prev => prev.filter(s => s.id !== sectionDeleteTarget.id));
      setSectionDeleteTarget(null);
    } catch (err) {
      console.log(err);
    } finally {
      setSectionDeleting(false);
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

      {/* ---------------- HEADER / OFFICIAL INFO ---------------- */}
      <div className="tb-card">
        <h2 className="tb-card-title">LGU & Accountability Info</h2>
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
              <label>Accountable Official</label>
              <input
                type="text"
                value={boardForm.official_name}
                onChange={e => setBoardForm({ ...boardForm, official_name: e.target.value })}
                placeholder="e.g. Hon. Juan Dela Cruz"
              />
            </div>
            <div className="form-group">
              <label>Position</label>
              <input
                type="text"
                value={boardForm.official_position}
                onChange={e => setBoardForm({ ...boardForm, official_position: e.target.value })}
                placeholder="e.g. Municipal Mayor"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Data As Of</label>
              <input
                type="date"
                value={boardForm.data_as_of}
                onChange={e => setBoardForm({ ...boardForm, data_as_of: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: 2 }}>
              <label>Data Source Note</label>
              <input
                type="text"
                value={boardForm.source_note}
                onChange={e => setBoardForm({ ...boardForm, source_note: e.target.value })}
                placeholder="e.g. As reported by the Municipal Budget Office"
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
              {boardSaving ? 'Saving...' : 'Save Header Info'}
            </button>
            {boardSaved && <span className="tb-saved-msg">Saved ✓</span>}
          </div>
        </form>
      </div>

      {/* ---------------- FUND BREAKDOWN ---------------- */}
      <div className="tb-card">
        <h2 className="tb-card-title">Budget by Fund</h2>
        <form onSubmit={handleFundsSubmit}>
          {fundsError && <div className="error-msg">{fundsError}</div>}

          {funds.map(fund => {
            const pct = Number(fund.allocated) > 0
              ? Math.min(100, Math.round((Number(fund.spent) / Number(fund.allocated)) * 100))
              : 0;
            return (
              <div className="tb-fund-row" key={fund.fund_type}>
                <div>
                  <div className="tb-fund-label">{fund.label}</div>
                  <div className="tb-fund-bar-track">
                    <div className="tb-fund-bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Allocated (₱)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={fund.allocated ?? ''}
                    onChange={e => updateFundField(fund.fund_type, 'allocated', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Spent (₱)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={fund.spent ?? ''}
                    onChange={e => updateFundField(fund.fund_type, 'spent', e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label>Remaining (₱)</label>
                  <input
                    type="number" step="0.01" min="0"
                    value={fund.remaining ?? ''}
                    onChange={e => updateFundField(fund.fund_type, 'remaining', e.target.value)}
                  />
                </div>
              </div>
            );
          })}

          <div className="tb-fund-totals">
            <div className="tb-fund-total-item">
              <span className="tb-fund-total-label">Total Allocated</span>
              <span className="tb-fund-total-value">{formatCurrency(fundTotals.allocated)}</span>
            </div>
            <div className="tb-fund-total-item">
              <span className="tb-fund-total-label">Total Spent</span>
              <span className="tb-fund-total-value" style={{ color: '#C0392B' }}>{formatCurrency(fundTotals.spent)}</span>
            </div>
            <div className="tb-fund-total-item">
              <span className="tb-fund-total-label">Total Remaining</span>
              <span className="tb-fund-total-value" style={{ color: '#1B8A4C' }}>{formatCurrency(fundTotals.remaining)}</span>
            </div>
          </div>

          <div className="form-buttons" style={{ marginTop: 16 }}>
            <button type="submit" className="btn-green" disabled={fundsSaving}>
              {fundsSaving ? 'Saving...' : 'Save Fund Breakdown'}
            </button>
            {fundsSaved && <span className="tb-saved-msg">Saved ✓</span>}
          </div>
        </form>
      </div>

      {/* ---------------- DOCUMENTS ---------------- */}
      <div className="tb-card">
        <div className="section-header">
          <h2 className="tb-card-title">Official Documents</h2>
          <button className="btn-green" onClick={() => setDocShowForm(true)}>+ Add Document</button>
        </div>

        {documents.length === 0 ? (
          <p className="tb-empty">No documents uploaded yet.</p>
        ) : (
          <div className="tb-doc-list">
            {documents.map(doc => (
              <div className="tb-doc-row" key={doc.id}>
                <div className="tb-doc-info">
                  <span className="tb-doc-title">
                    <a href={getImageUrl(doc.file_url)} target="_blank" rel="noreferrer">{doc.title}</a>
                  </span>
                  <span className="tb-doc-meta">
                    Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="tb-doc-actions">
                  <button className="btn-red" onClick={() => setDocDeleteTarget(doc)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
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

        <div className="tb-filter-row">
          <select value={infraStatusFilter} onChange={e => setInfraStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
          </select>
          <select value={infraCategoryFilter} onChange={e => setInfraCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filteredInfrastructure.length === 0 ? (
          <p className="tb-empty">No infrastructure projects match this filter.</p>
        ) : (
          <div className="tb-item-grid">
            {filteredInfrastructure.map(item => (
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
                  {(item.category || item.barangay) && (
                    <p className="tb-item-meta">
                      {[item.category, item.barangay].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {item.progress_percent != null && (
                    <>
                      <div className="tb-progress-track">
                        <div className="tb-progress-fill" style={{ width: `${item.progress_percent}%` }} />
                      </div>
                      <p className="tb-item-meta">{item.progress_percent}% complete
                        {item.target_completion_date && ` · Target: ${new Date(item.target_completion_date).toLocaleDateString()}`}
                      </p>
                    </>
                  )}
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

        <div className="tb-filter-row">
          <select value={accompCategoryFilter} onChange={e => setAccompCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {filteredAccomplishments.length === 0 ? (
          <p className="tb-empty">No accomplishments match this filter.</p>
        ) : (
          <div className="tb-item-grid">
            {filteredAccomplishments.map(item => (
              <div className="tb-item-card" key={item.id}>
                {item.image ? (
                  <img src={getImageUrl(item.image)} alt={item.title} className="tb-item-img" />
                ) : (
                  <div className="tb-item-img tb-item-img-empty" />
                )}
                <div className="tb-item-body">
                  {item.category && (
                    <span className="badge" style={{ backgroundColor: '#E1F5FE', color: '#0288D1' }}>
                      {item.category}
                    </span>
                  )}
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

      {/* ---------------- MORE (custom sections) ---------------- */}
      <div className="tb-card">
        <div className="section-header">
          <h2 className="tb-card-title">More</h2>
          <button
            className="btn-green"
            onClick={() => { setSectionForm(emptySectionForm); setSectionEditingId(null); setSectionImageFile(null); setSectionPreview(null); setSectionError(''); setSectionShowForm(true); }}
          >
            + Add Section
          </button>
        </div>
       

        {sections.length === 0 ? (
          <p className="tb-empty">No additional sections added yet.</p>
        ) : (
          <div className="tb-item-grid">
            {sections.map(item => (
              <div className="tb-item-card" key={item.id}>
                {item.image ? (
                  <img src={getImageUrl(item.image)} alt={item.title} className="tb-item-img" />
                ) : (
                  <div className="tb-item-img tb-item-img-empty" />
                )}
                <div className="tb-item-body">
                  <span
                    className="badge"
                    style={item.is_published
                      ? { backgroundColor: '#E8F5EE', color: '#1B8A4C' }
                      : { backgroundColor: '#F2F2F2', color: '#888' }}
                  >
                    {item.is_published ? 'Published' : 'Hidden'}
                  </span>
                  <h3>{item.title}</h3>
                  {item.content && <p className="tb-item-desc">{item.content}</p>}
                  <div className="tb-item-actions">
                    <button className="btn-gray" onClick={() => startSectionEdit(item)}>Edit</button>
                    <button className="btn-red" onClick={() => setSectionDeleteTarget(item)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- Document upload modal ---- */}
      {docShowForm && (
        <div className="tb-modal-overlay" onClick={cancelDocForm}>
          <div className="tb-modal" onClick={e => e.stopPropagation()}>
            <h2>Add Official Document</h2>
            <form onSubmit={handleDocSubmit}>
              {docError && <div className="error-msg">{docError}</div>}

              <div className="form-group">
                <label>Document Title</label>
                <input
                  type="text"
                  value={docForm.title}
                  onChange={e => setDocForm({ ...docForm, title: e.target.value })}
                  placeholder="e.g. Annual Budget FY 2026"
                  required
                />
              </div>

              <div className="form-group">
                <label>File (PDF)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={e => setDocFile(e.target.files[0] || null)}
                  required
                />
              </div>

              <div className="form-buttons">
                <button type="submit" className="btn-green" disabled={docSaving}>
                  {docSaving ? 'Uploading...' : 'Upload Document'}
                </button>
                <button type="button" className="btn-gray" onClick={cancelDocForm} disabled={docSaving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={infraForm.category}
                    onChange={e => setInfraForm({ ...infraForm, category: e.target.value })}
                  >
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Barangay / Location</label>
                  <input
                    type="text"
                    value={infraForm.barangay}
                    onChange={e => setInfraForm({ ...infraForm, barangay: e.target.value })}
                    placeholder="e.g. Brgy. Poblacion"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={infraForm.progress_percent}
                    onChange={e => setInfraForm({ ...infraForm, progress_percent: e.target.value })}
                    placeholder="0-100"
                  />
                </div>
                <div className="form-group">
                  <label>Target Completion Date</label>
                  <input
                    type="date"
                    value={infraForm.target_completion_date}
                    onChange={e => setInfraForm({ ...infraForm, target_completion_date: e.target.value })}
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
                <label>Category</label>
                <select
                  value={accompForm.category}
                  onChange={e => setAccompForm({ ...accompForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
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

      {/* ---- Section (More) add/edit modal ---- */}
      {sectionShowForm && (
        <div className="tb-modal-overlay" onClick={cancelSectionForm}>
          <div className="tb-modal" onClick={e => e.stopPropagation()}>
            <h2>{sectionEditingId ? 'Edit Section' : 'Add Section'}</h2>
            <form onSubmit={handleSectionSubmit}>
              {sectionError && <div className="error-msg">{sectionError}</div>}

              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={sectionForm.title}
                  onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })}
                  placeholder="e.g. Bids and Awards"
                  required
                />
              </div>

              <div className="form-group">
                <label>Content (optional)</label>
                <textarea
                  value={sectionForm.content}
                  onChange={e => setSectionForm({ ...sectionForm, content: e.target.value })}
                  placeholder="Plain text content for this section"
                  rows={5}
                />
              </div>

              <div className="form-group">
                <label>Image (optional)</label>
                <input type="file" accept="image/*" onChange={handleSectionImageChange} />
                {sectionPreview && <img src={sectionPreview} alt="Preview" className="tb-form-preview" />}
              </div>

              <label className="tb-toggle-row">
                <input
                  type="checkbox"
                  checked={sectionForm.is_published}
                  onChange={e => setSectionForm({ ...sectionForm, is_published: e.target.checked })}
                />
                <span>Publish this section to the mobile app</span>
              </label>

              <div className="form-buttons">
                <button type="submit" className="btn-green" disabled={sectionSaving}>
                  {sectionSaving ? 'Saving...' : sectionEditingId ? 'Save Changes' : 'Add Section'}
                </button>
                <button type="button" className="btn-gray" onClick={cancelSectionForm} disabled={sectionSaving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Delete confirmations ---- */}
      <ConfirmModal
        open={!!docDeleteTarget}
        title="Delete this document?"
        message={docDeleteTarget ? `This will permanently remove "${docDeleteTarget.title}" from the transparency board.` : ''}
        confirmLabel="Delete"
        tone="danger"
        loading={docDeleting}
        onConfirm={confirmDocDelete}
        onCancel={() => setDocDeleteTarget(null)}
      />
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
      <ConfirmModal
        open={!!sectionDeleteTarget}
        title="Delete this section?"
        message={sectionDeleteTarget ? `This will permanently remove "${sectionDeleteTarget.title}" from the transparency board.` : ''}
        confirmLabel="Delete"
        tone="danger"
        loading={sectionDeleting}
        onConfirm={confirmSectionDelete}
        onCancel={() => setSectionDeleteTarget(null)}
      />
    </div>
  );
}
