import { useEffect, useState } from 'react';
import axios from 'axios';
import Toast from '../components/Toast';
import { ShieldIcon, FlameIcon, CrossIcon, CheckCircleIcon, ClockIcon } from '../components/Icons';
import './OfficeDashboard.css';
import './ReportsPage.css'; // reuse table/badge/modal styles

const API = 'http://localhost:5000';

const OFFICE_META = {
  police:  { label: 'Police',               Icon: ShieldIcon, className: 'police' },
  bfp:     { label: 'BFP (Fire)',            Icon: FlameIcon,  className: 'bfp' },
  medical: { label: 'Medical / Ambulance',   Icon: CrossIcon,  className: 'medical' },
};

export default function OfficeDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('all'); // all | ongoing | resolved
  const [selected, setSelected]       = useState(null);
  const [note, setNote]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);

  const token = localStorage.getItem('token');
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');
  const meta  = OFFICE_META[admin.role] || { label: admin.role, Icon: ShieldIcon, className: 'police' };

  useEffect(() => {
    fetchAssignments();
  }, []);

  async function fetchAssignments() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/office/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data);
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to load assigned reports.' });
    } finally {
      setLoading(false);
    }
  }

  function openAssignment(a) {
    setSelected(a);
    setNote(a.action_note || '');
  }

  async function updateStatus(assignmentId, status) {
    try {
      const res = await axios.put(
        `${API}/api/office/assignments/${assignmentId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(prev =>
        prev.map(a => a.assignment_id === assignmentId ? { ...a, assignment_status: res.data.status } : a)
      );
      if (selected?.assignment_id === assignmentId) {
        setSelected(prev => ({ ...prev, assignment_status: res.data.status }));
      }
      setToast({ type: 'success', text: status === 'resolved' ? 'Marked as resolved.' : 'Cancel Resolved.' });
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to update status.' });
    }
  }

  async function saveNote(assignmentId) {
    setSaving(true);
    try {
      const res = await axios.put(
        `${API}/api/office/assignments/${assignmentId}`,
        { action_note: note },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(prev =>
        prev.map(a => a.assignment_id === assignmentId ? { ...a, action_note: res.data.action_note } : a)
      );
      setSelected(null);
      setToast({ type: 'success', text: 'Note saved.' });
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to save note.' });
    } finally {
      setSaving(false);
    }
  }

  const filtered = assignments.filter(a =>
    filter === 'all' || a.assignment_status === filter
  );
  const ongoingCount  = assignments.filter(a => a.assignment_status === 'ongoing').length;
  const resolvedCount = assignments.filter(a => a.assignment_status === 'resolved').length;

  return (
    <div className="page">
      <div className="office-header">
        <div className={`office-header-icon ${meta.className}`}>
          <meta.Icon width={22} height={22} />
        </div>
        <div>
          <h1>{meta.label} — Assigned Reports</h1>
          <div className="office-header-subtitle">Reports turned over to your office by the verifier.</div>
        </div>
      </div>

      <div className="office-stats-grid">
        <div className="stat-card">
          <h3>Total Assigned</h3>
          <div className="number">{assignments.length}</div>
        </div>
        <div className="stat-card pending">
          <h3>Ongoing</h3>
          <div className="number">{ongoingCount}</div>
        </div>
        <div className="stat-card">
          <h3>Resolved</h3>
          <div className="number">{resolvedCount}</div>
        </div>
      </div>

      <div className="filter-bar">
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="ongoing">Ongoing</option>
          <option value="resolved">Resolved</option>
        </select>
        <span style={{ fontSize: '13px', color: '#888' }}>
          {filtered.length} report(s)
        </span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Location Note</th>
            <th>Images</th>
            <th>Status</th>
            <th>Date Assigned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(4)].map((_, i) => (
              <tr key={i} className="skeleton-row">
                <td colSpan="7"><div className="skeleton-bar" /></td>
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan="7">
                <div className="empty-state">
                  <div className="empty-state-icon">📋</div>
                  <div className="empty-state-title">No reports assigned</div>
                  <div className="empty-state-text">Reports the verifier sends to your office will appear here.</div>
                </div>
              </td>
            </tr>
          ) : (
            filtered.map(a => (
              <tr key={a.assignment_id} className="report-row" onClick={() => openAssignment(a)}>
                <td>{a.name || '—'}</td>
                <td className="report-description-cell">{a.description}</td>
                <td>{a.location_note || '—'}</td>
                <td onClick={e => e.stopPropagation()}>
                  {a.images && a.images.length > 0 ? (
                    <div className="report-images">
                      {a.images.map((img, i) => (
                        <a key={i} href={`${API}/uploads/${img}`} target="_blank" rel="noreferrer">
                          <img src={`${API}/uploads/${img}`} alt="report" />
                        </a>
                      ))}
                    </div>
                  ) : '—'}
                </td>
                <td><span className={`badge badge-${a.assignment_status}`}>{a.assignment_status}</span></td>
                <td>{new Date(a.assigned_at).toLocaleDateString()} {new Date(a.assigned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="action-buttons">
                    {a.assignment_status === 'ongoing' ? (
                      <button className="btn-green" onClick={() => updateStatus(a.assignment_id, 'resolved')}>
                        Resolve
                      </button>
                    ) : (
                      <button className="btn-gray" onClick={() => updateStatus(a.assignment_id, 'ongoing')}>
                        Cancel Resolve
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {selected && (
        <div className="detail-modal-overlay" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <button className="map-modal-close" onClick={() => setSelected(null)}>✕</button>

            <h2 className="detail-modal-title">Report Details</h2>
            <span className={`badge badge-${selected.assignment_status}`}>{selected.assignment_status}</span>

            <div className="detail-grid">
              <div>
                <div className="detail-label">Name</div>
                <div className="detail-value">{selected.name || '—'}</div>
              </div>
              <div>
                <div className="detail-label">Contact</div>
                <div className="detail-value">{selected.contact || '—'}</div>
              </div>
              <div>
                <div className="detail-label">Location Note</div>
                <div className="detail-value">{selected.location_note || '—'}</div>
              </div>
              <div>
                <div className="detail-label">Date Assigned</div>
                <div className="detail-value">{new Date(selected.assigned_at).toLocaleString()}</div>
              </div>
            </div>

            <div className="detail-label">Description</div>
            <div className="detail-description">{selected.description}</div>

            {selected.images && selected.images.length > 0 && (
              <>
                <div className="detail-label">Images</div>
                <div className="report-images">
                  {selected.images.map((img, i) => (
                    <a key={i} href={`${API}/uploads/${img}`} target="_blank" rel="noreferrer">
                      <img src={`${API}/uploads/${img}`} alt="report" />
                    </a>
                  ))}
                </div>
              </>
            )}

            {selected.latitude && selected.longitude && (
              <>
                <div className="detail-label">Location</div>
                <div className="detail-map">
                  <iframe
                    title="office-report-map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${selected.longitude - 0.006}%2C${selected.latitude - 0.006}%2C${Number(selected.longitude) + 0.006}%2C${Number(selected.latitude) + 0.006}&layer=mapnik&marker=${selected.latitude}%2C${selected.longitude}`}
                  />
                </div>
              </>
            )}

            <div className="detail-label" style={{ marginTop: 16 }}>Action note (visible to Admin)</div>
            <textarea
              className="office-note-textarea"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Unit dispatched, arrived on scene..."
              rows={3}
            />
            <div className="office-note-hint">Short status update the Main Admin will see in the report trail.</div>

            <div className="action-buttons detail-modal-actions">
              <button className="btn-green" onClick={() => saveNote(selected.assignment_id)} disabled={saving}>
                {saving ? <><span className="spinner" /> Saving...</> : 'Save Note'}
              </button>
              {selected.assignment_status === 'ongoing' ? (
                <button className="btn-gray" onClick={() => updateStatus(selected.assignment_id, 'resolved')}>
                  Mark Resolved
                </button>
              ) : (
                <button className="btn-gray" onClick={() => updateStatus(selected.assignment_id, 'ongoing')}>
                  Cancel Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}