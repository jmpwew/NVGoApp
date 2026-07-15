import { useEffect, useState } from 'react';
import axios from 'axios';
import Toast from '../components/Toast';
import { ShieldIcon, FlameIcon, CrossIcon } from '../components/Icons';
import './VerifierDashboard.css';
import './OfficeDashboard.css'; // reuse shared stats-grid layout
import './ReportsPage.css'; // reuse table/badge/modal styles

const API = 'http://localhost:5000';

const OFFICE_OPTIONS = [
  { value: 'police',  label: 'Police',               Icon: ShieldIcon },
  { value: 'bfp',     label: 'BFP (Fire)',            Icon: FlameIcon },
  { value: 'medical', label: 'Medical / Ambulance',   Icon: CrossIcon },
];

export default function VerifierDashboard() {
  const [pending, setPending]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null); // report being reviewed
  const [checked, setChecked]     = useState([]);   // office roles picked
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPending();
  }, []);

  async function fetchPending() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/verifier/reports/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPending(res.data);
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to load pending reports.' });
    } finally {
      setLoading(false);
    }
  }

  function openReview(report) {
    setSelected(report);
    setChecked([]);
  }

  function toggleOffice(value) {
    setChecked(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }

  async function submitVerification() {
    if (checked.length === 0) {
      setToast({ type: 'error', text: 'Select at least one office before submitting.' });
      return;
    }
    setSubmitting(true);
    try {
      await axios.put(
        `${API}/api/verifier/reports/${selected.id}/verify`,
        { officeRoles: checked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPending(prev => prev.filter(r => r.id !== selected.id));
      setSelected(null);
      setToast({ type: 'success', text: 'Report verified and forwarded.' });
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to verify report.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">

      <h1>Report Verifier</h1>
      <p className="page-subtitle">Review each report and choose which office(s) should respond.</p>

      <div className="office-stats-grid">
        <div className="stat-card pending">
          <h3>Awaiting Review</h3>
          <div className="number">{loading ? '—' : pending.length}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Contact</th>
            <th>Description</th>
            <th>Location Note</th>
            <th>Images</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(4)].map((_, i) => (
              <tr key={i} className="skeleton-row">
                <td colSpan="7"><div className="skeleton-bar" /></td>
              </tr>
            ))
          ) : pending.length === 0 ? (
            <tr>
              <td colSpan="7">
                <div className="empty-state">
                  <div className="empty-state-icon">✅</div>
                  <div className="empty-state-title">No pending reports</div>
                  <div className="empty-state-text">New reports will appear here for review.</div>
                </div>
              </td>
            </tr>
          ) : (
            pending.map(r => (
              <tr key={r.id} className="report-row" onClick={() => openReview(r)}>
                <td>{r.name || '—'}</td>
                <td>{r.contact || '—'}</td>
                <td className="report-description-cell">{r.description}</td>
                <td>{r.location_note || '—'}</td>
                <td onClick={e => e.stopPropagation()}>
                  {r.images && r.images.length > 0 ? (
                    <div className="report-images">
                      {r.images.map((img, i) => (
                        <a key={i} href={`${API}/uploads/${img}`} target="_blank" rel="noreferrer">
                          <img src={`${API}/uploads/${img}`} alt="report" />
                        </a>
                      ))}
                    </div>
                  ) : '—'}
                </td>
                <td>{new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn-green" onClick={() => openReview(r)}>Review</button>
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

            <h2 className="detail-modal-title">Review Report</h2>

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
                <div className="detail-label">Date Submitted</div>
                <div className="detail-value">{new Date(selected.created_at).toLocaleString()}</div>
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
                    title="verify-report-map"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${selected.longitude - 0.006}%2C${selected.latitude - 0.006}%2C${Number(selected.longitude) + 0.006}%2C${Number(selected.latitude) + 0.006}&layer=mapnik&marker=${selected.latitude}%2C${selected.longitude}`}
                  />
                </div>
              </>
            )}

            <div className="detail-label">Send to office(s)</div>
            <div className="office-picker">
              {OFFICE_OPTIONS.map(opt => (
                <button
                  type="button"
                  key={opt.value}
                  className={`office-option office-option-${opt.value} ${checked.includes(opt.value) ? 'selected' : ''}`}
                  onClick={() => toggleOffice(opt.value)}
                >
                  <span className="office-option-icon"><opt.Icon width={18} height={18} /></span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="action-buttons detail-modal-actions">
              <button className="btn-green" onClick={submitVerification} disabled={submitting}>
                {submitting ? <><span className="spinner" /> Submitting...</> : 'Verify & Turnover'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}