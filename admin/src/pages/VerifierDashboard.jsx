import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Toast from '../components/Toast';
import { ShieldIcon, FlameIcon, CrossIcon, MapPinIcon, PhotoIcon, VideoIcon } from '../components/Icons';
import './VerifierDashboard.css';
import './OfficeDashboard.css';
import './ReportsPage.css';
import playNotificationSound from '../playNotificationSound';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

import { API } from '../config';
import { getImageUrl } from '../getImageUrl';

const OFFICE_OPTIONS = [
  { value: 'police',  label: 'Police',               Icon: ShieldIcon },
  { value: 'bfp',     label: 'BFP (Fire)',            Icon: FlameIcon },
  { value: 'medical', label: 'Medical / Ambulance',   Icon: CrossIcon },
];

const OFFICE_LABELS = Object.fromEntries(OFFICE_OPTIONS.map(o => [o.value, o.label]));

export default function VerifierDashboard() {
  const [pending, setPending]     = useState([]);
  const [verified, setVerified]   = useState([]);
  const [view, setView]           = useState('pending'); // 'pending' | 'verified'
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null); // report being reviewed
  const [readOnly, setReadOnly]   = useState(false); // true when viewing a verified report
  const [checked, setChecked]     = useState([]);   // office roles picked
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState(null);
  const token = localStorage.getItem('token');
  const prevPendingCount = useRef(null); // null = not fetched yet, so we don't ding on first load

  useEffect(() => {
    fetchPending();
    fetchVerified();

    // Keep pending/verified lists fresh without a manual refresh, same 5s
    // cadence as DashboardPage/App.jsx. silent=true on the poll skips the
    // loading-skeleton flash, same as ReportsPage.
    const interval = setInterval(() => {
      fetchPending(true);
      fetchVerified();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchPending(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${API}/api/verifier/reports/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (prevPendingCount.current !== null && res.data.length > prevPendingCount.current) {
        playNotificationSound();
      }
      prevPendingCount.current = res.data.length;
      setPending(res.data);
    } catch (err) {
      console.log(err);
      if (!silent) setToast({ type: 'error', text: 'Failed to load pending reports.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function fetchVerified() {
    try {
      const res = await axios.get(`${API}/api/verifier/reports/verified`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setVerified(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  function openReview(report, isReadOnly = false) {
    setSelected(report);
    setReadOnly(isReadOnly);
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
      fetchVerified();
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

      <div className="page-header-row">
        <div>
          <h1>Report verifier</h1>
          
        </div>
        <div className="live-chip">
          <span className={`live-chip-dot ${pending.length === 0 ? 'calm' : ''}`} />
          {loading ? 'Loading…' : `${pending.length} awaiting review`}
        </div>
      </div>

      <div className="metric-grid verifier-metric-grid">
        <div className={`metric-card ${pending.length > 0 ? 'accent' : ''}`}>
          <div className="metric-card-label">Awaiting review</div>
          <div className="metric-card-value">{loading ? '—' : pending.length}</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">Total verified</div>
          <div className="metric-card-value">{loading ? '—' : verified.length}</div>
        </div>
      </div>

      <div className="filter-pill-bar">
        <button
          className={`filter-pill ${view === 'pending' ? 'active' : ''}`}
          onClick={() => setView('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-pill ${view === 'verified' ? 'active' : ''}`}
          onClick={() => setView('verified')}
        >
          Verified
        </button>
        <span className="filter-pill-count">
          {(view === 'pending' ? pending.length : verified.length)} report(s)
        </span>
      </div>

      {view === 'pending' ? (
        loading ? (
          <div className="case-card-list">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-row"><div className="skeleton-bar" /></div>
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">No pending reports</div>
            <div className="empty-state-text">New reports will appear here for review.</div>
          </div>
        ) : (
        <div className="case-card-list">
          {pending.map(r => (
            <div key={r.id} className="case-card" onClick={() => openReview(r)}>
              <div className="case-card-stripe status-pending" />
              <div className="avatar-circle">{initials(r.name)}</div>
              <div className="case-card-body">
                <div className="case-card-top">
                  <span className="case-card-name">{r.name || 'Anonymous'}</span>
                  {r.contact && <span className="case-card-time">{r.contact}</span>}
                </div>
                <div className="case-card-desc">{r.description}</div>
                <div className="case-card-meta">
                  {r.location_note && (
                    <span className="case-card-meta-item"><MapPinIcon width={13} height={13} />{r.location_note}</span>
                  )}
                  {r.images && r.images.length > 0 && (
                    <span className="case-card-meta-item"><PhotoIcon width={13} height={13} />{r.images.length}</span>
                  )}
                  {r.videos && r.videos.length > 0 && (
                    <span className="case-card-meta-item"><VideoIcon width={13} height={13} />{r.videos.length}</span>
                  )}
                </div>
              </div>
              <span className="case-card-time">{timeAgo(r.created_at)}</span>
              <button className="btn-green case-card-action" onClick={(e) => { e.stopPropagation(); openReview(r); }}>
                Review
              </button>
            </div>
          ))}
        </div>
        )
      ) : (
        verified.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗂️</div>
            <div className="empty-state-title">No verified reports yet</div>
            <div className="empty-state-text">Reports you verify will show up here for reference.</div>
          </div>
        ) : (
          <div className="case-card-list">
            {verified.map(r => (
              <div key={r.id} className="case-card" onClick={() => openReview(r, true)}>
                <div className="case-card-stripe status-resolved" />
                <div className="avatar-circle">{initials(r.name)}</div>
                <div className="case-card-body">
                  <div className="case-card-top">
                    <span className="case-card-name">{r.name || 'Anonymous'}</span>
                    <span className="badge badge-verifier">verified</span>
                  </div>
                  <div className="case-card-desc">{r.description}</div>
                  <div className="case-card-meta">
                    {r.location_note && (
                      <span className="case-card-meta-item"><MapPinIcon width={13} height={13} />{r.location_note}</span>
                    )}
                    {(r.office_roles || []).map(role => (
                      <span key={role} className={`badge badge-office-${role}`}>{OFFICE_LABELS[role] || role}</span>
                    ))}
                  </div>
                </div>
                <span className="case-card-time">{timeAgo(r.verified_at)}</span>
              </div>
            ))}
          </div>
        )
      )}

      {selected && (
        <div className="detail-modal-overlay" onClick={() => setSelected(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <button className="map-modal-close" onClick={() => setSelected(null)}>✕</button>

            <h2 className="detail-modal-title">{readOnly ? 'Verified Report' : 'Review Report'}</h2>
            {readOnly && (
              <div className="detail-value" style={{ marginBottom: 4 }}>
                <span className="badge badge-verifier">verified</span>
                {' '}Verified on {new Date(selected.verified_at).toLocaleString()}
              </div>
            )}

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
                    <a key={i} href={getImageUrl(img)} target="_blank" rel="noreferrer">
                      <img src={getImageUrl(img)} alt="report" />
                    </a>
                  ))}
                </div>
              </>
            )}

            {selected.videos && selected.videos.length > 0 && (
              <>
                <div className="detail-label">Videos</div>
                <div className="report-videos">
                  {selected.videos.map((vid, i) => (
                    <video key={i} src={getImageUrl(vid)} controls preload="metadata" />
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

            {readOnly ? (
              <>
                <div className="detail-label">Sent to office(s)</div>
                <div className="detail-value" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(selected.office_roles || []).length > 0
                    ? selected.office_roles.map(role => (
                        <span key={role} className={`badge badge-office-${role}`}>{OFFICE_LABELS[role] || role}</span>
                      ))
                    : '—'}
                </div>
                <div className="action-buttons detail-modal-actions">
                  <button className="btn-gray" onClick={() => setSelected(null)}>Close</button>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}