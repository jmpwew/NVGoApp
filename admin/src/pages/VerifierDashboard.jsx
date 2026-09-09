import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { ShieldIcon, FlameIcon, CrossIcon, MapPinIcon, PhotoIcon, VideoIcon, UserIcon, PhoneIcon, ClockIcon, AlertTriangleIcon, CloseIcon, CheckCircleIcon, ClipboardListIcon, BellIcon, BellOffIcon } from '../components/Icons';
import { REPORT_TYPES, REPORT_TYPE_LABELS } from '../constants/reportTypes';
import playNotificationSound from '../playNotificationSound';
import './VerifierDashboard.css';
import './OfficeDashboard.css';
import './ReportsPage.css';

const MUTE_STORAGE_KEY = 'verifier_alert_muted';

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
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_STORAGE_KEY) === '1');
  const [newAlerts, setNewAlerts] = useState([]);
  const seenIdsRef = useRef(null); 
  const mutedRef = useRef(muted);
  const token = localStorage.getItem('token');

  useEffect(() => { mutedRef.current = muted; }, [muted]);

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
      const data = res.data;

      if (seenIdsRef.current === null) {
        // First load: just remember what's already here, don't alert on it.
        seenIdsRef.current = new Set(data.map(r => r.id));
      } else {
        const freshOnes = data.filter(r => !seenIdsRef.current.has(r.id));
        if (freshOnes.length > 0) {
          freshOnes.forEach(r => seenIdsRef.current.add(r.id));
          freshOnes.forEach(r => triggerNewReportAlert(r));
        }
      }

      setPending(data);
    } catch (err) {
      console.log(err);
      if (!silent) setToast({ type: 'error', text: 'Failed to load pending reports.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }


  function triggerNewReportAlert(r) {
    const alertId = `${r.id}-${Date.now()}`;
    setNewAlerts(prev => [...prev, { ...r, alertId }]);

    if (!mutedRef.current) playNotificationSound();
  }

  function toggleMute() {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
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
    // Opening a report is what clears its "new report" alert(s).
    setNewAlerts(prev => prev.filter(x => x.id !== report.id));
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

  
  async function submitReassign() {
    if (checked.length === 0) {
      setToast({ type: 'error', text: 'Select at least one office to (re)assign.' });
      return;
    }
    setSubmitting(true);
    try {
      await axios.put(
        `${API}/api/verifier/reports/${selected.id}/reassign`,
        { officeRoles: checked },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchVerified();
      setSelected(null);
      setToast({ type: 'success', text: 'Report reassigned.' });
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: err.response?.data?.message || 'Failed to reassign report.' });
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className={`alert-mute-toggle ${muted ? 'is-muted' : ''}`}
            onClick={toggleMute}
            title={muted ? 'Unmute new-report alert sound' : 'Mute new-report alert sound'}
          >
            {muted ? <BellOffIcon width={16} height={16} /> : <BellIcon width={16} height={16} />}
            {muted ? 'Muted' : 'Alert sound on'}
          </button>
          <div className="live-chip">
            {loading ? 'Loading…' : `${pending.length} awaiting review`}
          </div>
        </div>
      </div>

      {newAlerts.length > 0 && (
        <div className="new-report-alerts">
          {newAlerts.map(r => (
            <div key={r.alertId} className="new-report-banner is-normal">
              <span className="new-report-banner-icon"><AlertTriangleIcon width={16} height={16} /></span>
              <span className="new-report-banner-text">
                New report submitted — {r.name || 'Anonymous'}
                {r.barangay ? `, Brgy. ${r.barangay}` : ''}
              </span>
              <button
                className="new-report-banner-view"
                onClick={() => openReview(r)}
              >
                Review
              </button>
            </div>
          ))}
        </div>
      )}

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
            <div className="empty-state-icon"><CheckCircleIcon width={32} height={32} /></div>
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
                  {r.barangay && (
                    <span className="case-card-meta-item"><MapPinIcon width={13} height={13} />Brgy. {r.barangay}</span>
                  )}
                  {r.location_note && (
                    <span className="case-card-meta-item">{!r.barangay && <MapPinIcon width={13} height={13} />}{r.location_note}</span>
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
            <div className="empty-state-icon"><ClipboardListIcon width={32} height={32} /></div>
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
                    {r.barangay && (
                      <span className="case-card-meta-item"><MapPinIcon width={13} height={13} />Brgy. {r.barangay}</span>
                    )}
                    {r.location_note && (
                      <span className="case-card-meta-item">{!r.barangay && <MapPinIcon width={13} height={13} />}{r.location_note}</span>
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
            <div className="detail-modal-header">
              <div className="detail-modal-header-top">
                <h2 className="detail-modal-title">{readOnly ? 'Verified Report' : 'Review Report'}</h2>
                <button className="detail-modal-close" onClick={() => setSelected(null)} aria-label="Close">
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
              <div className="detail-modal-badges">
                {readOnly && (
                  <>
                    <span className="badge badge-verifier">Verified</span>
                    <span className="detail-value" style={{ fontSize: 12, color: '#999' }}>
                      on {new Date(selected.verified_at).toLocaleString()}
                    </span>
                  </>
                )}
                {selected.is_urgent && (
                  <span className="badge badge-urgent">
                    <AlertTriangleIcon /> Urgent
                  </span>
                )}
              </div>
            </div>

            <div className="detail-modal-body">
              <div className="detail-grid">
                <div className="detail-info-card">
                  <div className="detail-label"><UserIcon width={13} height={13} /> Name</div>
                  <div className="detail-value">{selected.name || '—'}</div>
                </div>
                <div className="detail-info-card">
                  <div className="detail-label"><PhoneIcon width={13} height={13} /> Contact</div>
                  <div className="detail-value">{selected.contact || '—'}</div>
                </div>
                <div className="detail-info-card">
                  <div className="detail-label"><MapPinIcon width={13} height={13} /> Barangay</div>
                  <div className="detail-value">{selected.barangay ? `Brgy. ${selected.barangay}` : '—'}</div>
                </div>
                <div className="detail-info-card">
                  <div className="detail-label"><MapPinIcon width={13} height={13} /> Location Note</div>
                  <div className="detail-value">{selected.location_note || '—'}</div>
                </div>
                <div className="detail-info-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label"><ClockIcon width={13} height={13} /> Date Submitted</div>
                  <div className="detail-value">{new Date(selected.created_at).toLocaleString()}</div>
                </div>
              </div>

              <div className="detail-label" style={{ marginTop: 0 }}>Description</div>
              <div className="detail-description">{selected.description}</div>

              {selected.images && selected.images.length > 0 && (
                <>
                  <div className="detail-label"><PhotoIcon width={13} height={13} /> Images</div>
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
                  <div className="detail-label"><VideoIcon width={13} height={13} /> Videos</div>
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
                  </div>

                  <div className="detail-label">Sent to office(s)</div>
                  <div className="detail-value" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {(selected.office_roles || []).length > 0
                      ? selected.office_roles.map(role => (
                          <span key={role} className={`badge badge-office-${role}`}>{OFFICE_LABELS[role] || role}</span>
                        ))
                      : '—'}
                  </div>

                  <div className="detail-label" style={{ marginTop: 14 }}>
                    Reassign / escalate to office(s)
                  </div>
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
                  <div className="detail-value" style={{ marginTop: 4, opacity: 0.7, fontSize: 12 }}>
                    Picking an office already listed above re-forwards / escalates it instead of adding a duplicate.
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
                </>
              )}
            </div>

            {readOnly ? (
              <div className="action-buttons detail-modal-actions">
                <button className="btn-gray" onClick={() => setSelected(null)}>Close</button>
                <button className="btn-green" onClick={submitReassign} disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Submitting...</> : 'Reassign / Escalate'}
                </button>
              </div>
            ) : (
              <div className="action-buttons detail-modal-actions">
                <button className="btn-green" onClick={requestVerify} disabled={submitting}>
                  {submitting ? <><span className="spinner" /> Submitting...</> : 'Verify & Turnover'}
                </button>
              </div>
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