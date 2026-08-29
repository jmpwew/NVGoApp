import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { ShieldIcon, FlameIcon, CrossIcon, MapPinIcon, PhotoIcon, VideoIcon } from '../components/Icons';
import { REPORT_TYPES, REPORT_TYPE_LABELS } from '../constants/reportTypes';
import './VerifierDashboard.css';
import './OfficeDashboard.css';
import './ReportsPage.css';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [pending, setPending]     = useState([]);
  const [verified, setVerified]   = useState([]);
  const [view, setView]           = useState('pending'); 
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null); 
  const [readOnly, setReadOnly]   = useState(false); 
  const [checked, setChecked]     = useState([]);  
  const [reportType, setReportType] = useState('');
  const [isUrgent, setIsUrgent]   = useState(false); 
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState(null);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const PAGE_SIZE = 10;
  const [confirmVerify, setConfirmVerify] = useState(false); 
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchPending();
    fetchVerified();

 
    const interval = setInterval(() => {
      fetchPending(true);
      fetchVerified();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [view, search]);

 
  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (!reportId || (pending.length === 0 && verified.length === 0)) return;

    const inPending = pending.find(r => String(r.id) === reportId);
    if (inPending) {
      openReview(inPending);
      setSearchParams({}, { replace: true });
      return;
    }
    const inVerified = verified.find(r => String(r.id) === reportId);
    if (inVerified) {
      openReview(inVerified, true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, pending, verified]);


  useEffect(() => {
    if (!selected || confirmVerify) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSelected(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selected, confirmVerify]);

  async function fetchPending(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${API}/api/verifier/reports/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    setReportType(report.report_type || '');
    setIsUrgent(!!report.is_urgent);
  }

  function toggleOffice(value) {
    setChecked(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  }

  function requestVerify() {
    if (!reportType) {
      setToast({ type: 'error', text: 'Select a report type before submitting.' });
      return;
    }
    if (checked.length === 0) {
      setToast({ type: 'error', text: 'Select at least one office before submitting.' });
      return;
    }
    setConfirmVerify(true);
  }

  async function submitVerification() {
    setSubmitting(true);
    try {
      await axios.put(
        `${API}/api/verifier/reports/${selected.id}/verify`,
        { officeRoles: checked, reportType, isUrgent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPending(prev => prev.filter(r => r.id !== selected.id));
      fetchVerified();
      setSelected(null);
      setConfirmVerify(false);
      setToast({ type: 'success', text: 'Report verified and forwarded.' });
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to verify report.' });
    } finally {
      setSubmitting(false);
    }
  }


  const activeList = view === 'pending' ? pending : verified;
  const filtered = activeList.filter(r =>
    r.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.description?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

      <div className="report-tabs">
        <button
          className={`report-tab ${view === 'pending' ? 'active' : ''}`}
          onClick={() => setView('pending')}
        >
          Pending <span className="report-tab-count">{pending.length}</span>
        </button>
        <button
          className={`report-tab ${view === 'verified' ? 'active' : ''}`}
          onClick={() => setView('verified')}
        >
          Verified <span className="report-tab-count">{verified.length}</span>
        </button>
      </div>

      <div className="filter-pill-bar">
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Search by name or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="filter-pill-count">
          {filtered.length} report(s)
        </span>
      </div>

      {view === 'pending' ? (
        loading ? (
          <div className="case-card-list">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-row"><div className="skeleton-bar" /></div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <div className="empty-state-title">{pending.length === 0 ? 'No pending reports' : 'No matching reports'}</div>
            <div className="empty-state-text">
              {pending.length === 0 ? 'New reports will appear here for review.' : 'Try a different search term.'}
            </div>
          </div>
        ) : (
        <div className="case-card-list">
          {paginated.map(r => (
            <div key={r.id} className="case-card" onClick={() => openReview(r)}>
              <div className="case-card-stripe status-pending" />
              <div className="avatar-circle">{initials(r.name)}</div>
              <div className="case-card-body">
                <div className="case-card-top">
                  <span className="case-card-name">{r.name || 'Anonymous'}</span>
                  {r.contact && <span className="case-card-time">{r.contact}</span>}
                  {r.is_urgent && <span className="badge badge-urgent">Urgent</span>}
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
        filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🗂️</div>
            <div className="empty-state-title">{verified.length === 0 ? 'No verified reports yet' : 'No matching reports'}</div>
            <div className="empty-state-text">
              {verified.length === 0 ? 'Reports you verify will show up here for reference.' : 'Try a different search term.'}
            </div>
          </div>
        ) : (
          <div className="case-card-list">
            {paginated.map(r => (
              <div key={r.id} className="case-card" onClick={() => openReview(r, true)}>
                <div className="case-card-stripe status-resolved" />
                <div className="avatar-circle">{initials(r.name)}</div>
                <div className="case-card-body">
                  <div className="case-card-top">
                    <span className="case-card-name">{r.name || 'Anonymous'}</span>
                    <span className="badge badge-verifier">verified</span>
                    {r.is_urgent && <span className="badge badge-urgent">Urgent</span>}
                  </div>
                  <div className="case-card-desc">{r.description}</div>
                  <div className="case-card-meta">
                    {r.report_type && (
                      <span className="case-card-meta-item">{REPORT_TYPE_LABELS[r.report_type] || r.report_type}</span>
                    )}
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

      {!loading && filtered.length > 0 && totalPages > 1 && (
        <div className="pagination-bar">
          <button
            className="btn-gray pagination-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>
          <span className="pagination-status">Page {currentPage} of {totalPages}</span>
          <button
            className="btn-gray pagination-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
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
                <div className="detail-label">Report type</div>
                <div className="detail-value" style={{ marginBottom: 10 }}>
                  {REPORT_TYPE_LABELS[selected.report_type] || selected.report_type || '—'}
                  {selected.is_urgent && <span className="badge badge-urgent" style={{ marginLeft: 8 }}>Urgent</span>}
                </div>

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
                <div className="detail-label">Report type</div>
                <select
                  className="verifier-report-type-select"
                  value={reportType}
                  onChange={e => setReportType(e.target.value)}
                >
                  <option value="" disabled>Select report type…</option>
                  {REPORT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  className={`urgent-toggle-btn ${isUrgent ? 'active' : ''}`}
                  style={{ marginTop: 10 }}
                  onClick={() => setIsUrgent(v => !v)}
                >
                  {isUrgent ? '✓ Urgent / Priority' : 'Mark as Urgent / Priority'}
                </button>

                <div className="detail-label" style={{ marginTop: 14 }}>Send to office(s)</div>
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
                  <button className="btn-green" onClick={requestVerify} disabled={submitting}>
                    {submitting ? <><span className="spinner" /> Submitting...</> : 'Verify & Turnover'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmVerify}
        title="Verify and forward this report?"
        message={
          `This will tag "${selected?.name || 'this report'}" as ${REPORT_TYPE_LABELS[reportType] || reportType} and send it to: ` +
          checked.map(role => OFFICE_LABELS[role] || role).join(', ') +
          '. This action cannot be undone.'
        }
        confirmLabel="Verify & Turnover"
        loading={submitting}
        onConfirm={submitVerification}
        onCancel={() => setConfirmVerify(false)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}