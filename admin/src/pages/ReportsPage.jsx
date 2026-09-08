import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { ShieldIcon, FlameIcon, CrossIcon, MapPinIcon, PhotoIcon, VideoIcon, UserIcon, PhoneIcon, ClockIcon, AlertTriangleIcon, CloseIcon, TrashIcon } from '../components/Icons';
import './ReportsPage.css';

import { API } from '../config';
import { getImageUrl } from '../getImageUrl';

const OFFICE_META = {
  police:  { label: 'Police',             Icon: ShieldIcon },
  bfp:     { label: 'BFP (Fire)',          Icon: FlameIcon },
  medical: { label: 'MDRRMO', Icon: CrossIcon },
};

const STATUS_LABELS = {
  pending:    'Pending',
  ongoing:    'Ongoing',
  dispatched: 'Unit Dispatched',
  resolved:   'Resolved',
};

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

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');  
  const [search, setSearch]     = useState('');
  const [expandedMap, setExpandedMap] = useState(null);     
  const [selectedReport, setSelectedReport] = useState(null); 
  const [toast, setToast]       = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => fetchReports(true), 5000);
    return () => clearInterval(interval);
  }, []);

  
  useEffect(() => {
    const searchQuery = searchParams.get('search');
    if (searchQuery) {
      setSearch(searchQuery);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('search');
        return next;
      }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (!reportId || reports.length === 0) return;

    const match = reports.find(r => String(r.id) === reportId);
    if (match) {
      setSelectedReport(match);

      setSearchParams({}, { replace: true });
    }
  }, [searchParams, reports]);


  async function fetchReports(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/reports/trail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (err) {
      console.log(err);
      if (!silent) setToast({ type: 'error', text: 'Failed to load reports.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }


  async function updateStatus(id, status) {
    try {
      await axios.put(`${API}/api/admin/reports/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(prev =>
        prev.map(r => r.id === id ? { ...r, status } : r)
      );
      setToast({ type: 'success', text: 'Status updated.' });
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to update status.' });
    }
  }

  function requestDelete(report) {
    setDeleteTarget(report);
    setDeleteReason('');
  }

  async function confirmDelete() {
    if (!deleteReason.trim()) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/api/admin/reports/${deleteTarget.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { reason: deleteReason.trim() },
      });
      setReports(prev => prev.filter(r => r.id !== deleteTarget.id));
      setToast({ type: 'success', text: 'Report deleted.' });
      setDeleteTarget(null);
      setSelectedReport(null);
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to delete report.' });
    } finally {
      setDeleting(false);
    }
  }

  // Filter and search
  const filtered = reports.filter(r => {
    const matchesFilter = filter === 'all' || r.status === filter;
    const matchesSearch = r.name?.toLowerCase().includes(search.toLowerCase()) ||
                          r.description?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="page">

      <div className="page-header-row">
        <div>
          <h1>Reports</h1>
        </div>
      </div>

      <div className="report-tabs">
        {[
          { value: 'all',      label: 'All',      count: reports.length },
          { value: 'pending',  label: 'Pending',  count: reports.filter(r => r.status === 'pending').length },
          { value: 'ongoing',  label: 'Ongoing',  count: reports.filter(r => r.status === 'ongoing').length },
          { value: 'resolved', label: 'Resolved', count: reports.filter(r => r.status === 'resolved').length },
        ].map(opt => (
          <button
            key={opt.value}
            className={`report-tab ${filter === opt.value ? 'active' : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label} <span className="report-tab-count">{opt.count}</span>
          </button>
        ))}
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
        <span className="filter-pill-count">{filtered.length} report(s)</span>
      </div>

      {loading ? (
        <div className="case-card-list">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row"><div className="skeleton-bar" /></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">No reports found</div>
          <div className="empty-state-text">Try a different search or filter.</div>
        </div>
      ) : (
        <div className="case-card-list">
          {filtered.map(r => (
            <div
              key={r.id}
              className={`case-card ${r.status === 'resolved' ? 'is-resolved' : ''}`}
              onClick={() => setSelectedReport(r)}
            >
              <div className={`case-card-stripe status-${r.status}`} />
              <div className="avatar-circle">{initials(r.name)}</div>
              <div className="case-card-body">
                <div className="case-card-top">
                  <span className="case-card-name">{r.name || 'Anonymous'}</span>
                  {r.is_urgent && (
                    <span className="case-card-urgent-icon" title="Urgent">
                      <AlertTriangleIcon width={13} height={13} />
                    </span>
                  )}
                  <span className={`badge badge-${r.status} case-card-status`}>{STATUS_LABELS[r.status] || r.status}</span>
                </div>
                <div className="case-card-desc case-card-desc-1line">{r.description}</div>
                <div className="case-card-meta">
                  {r.barangay && (
                    <span className="case-card-meta-item">
                      <MapPinIcon width={13} height={13} />Brgy. {r.barangay}
                    </span>
                  )}
                  {r.location_note && (
                    <span
                      className="case-card-meta-item"
                      onClick={e => { if (r.latitude && r.longitude) { e.stopPropagation(); setExpandedMap({ lat: r.latitude, lng: r.longitude }); } }}
                      style={r.latitude && r.longitude ? { cursor: 'pointer' } : undefined}
                      title={r.latitude && r.longitude ? 'Click to view map' : undefined}
                    >
                      {!r.barangay && <MapPinIcon width={13} height={13} />}{r.location_note}
                    </span>
                  )}
                  {r.images && r.images.length > 0 && (
                    <span className="case-card-meta-item"><PhotoIcon width={13} height={13} />{r.images.length}</span>
                  )}
                  {r.videos && r.videos.length > 0 && (
                    <span className="case-card-meta-item"><VideoIcon width={13} height={13} />{r.videos.length}</span>
                  )}
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                  {r.verifier ? (
                    r.assignments && r.assignments.length > 0 ? (
                      (() => {
                        const first = r.assignments[0];
                        const om = OFFICE_META[first.office_role];
                        const Icon = om?.Icon;
                        const extra = r.assignments.length - 1;
                        return (
                          <span className="case-card-meta-item case-card-trail-summary">
                            {Icon && <Icon width={13} height={13} />}
                            <span className={`badge badge-office-${first.office_role}`}>{om ? om.label : first.office_role}</span>
                            {extra > 0 && <span className="case-card-trail-extra">+{extra}</span>}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="case-card-meta-item case-card-trail-summary case-card-trail-muted">No office assigned yet</span>
                    )
                  ) : (
                    <span className="case-card-meta-item case-card-trail-summary case-card-trail-muted">Awaiting verifier</span>
                  )}
                </div>
              </div>
              <span className="case-card-time">{timeAgo(r.created_at)}</span>
              <div className="action-buttons case-card-action" onClick={e => e.stopPropagation()}>
                <button className="btn-gray" onClick={() => setSelectedReport(r)}>View</button>
                <button className="case-card-delete-btn" title="Delete report" onClick={() => requestDelete(r)}>
                  <TrashIcon width={15} height={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {expandedMap && (
        <div className="map-modal-overlay" onClick={() => setExpandedMap(null)}>
          <div className="map-modal" onClick={e => e.stopPropagation()}>
            <button className="map-modal-close" onClick={() => setExpandedMap(null)}>
              ✕
            </button>
            <iframe
              title="expanded-report-map"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${expandedMap.lng - 0.01}%2C${expandedMap.lat - 0.01}%2C${Number(expandedMap.lng) + 0.01}%2C${Number(expandedMap.lat) + 0.01}&layer=mapnik&marker=${expandedMap.lat}%2C${expandedMap.lng}`}
            />
          </div>
        </div>
      )}

      {selectedReport && (
        <div className="detail-modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="detail-modal" onClick={e => e.stopPropagation()}>
            <div className="detail-modal-header">
              <div className="detail-modal-header-top">
                <h2 className="detail-modal-title">Report Details</h2>
                <button className="detail-modal-close" onClick={() => setSelectedReport(null)} aria-label="Close">
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
              <div className="detail-modal-badges">
                <span className={`badge badge-${selectedReport.status}`}>{selectedReport.status}</span>
                {selectedReport.is_urgent && (
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
                  <div className="detail-value">{selectedReport.name || '—'}</div>
                </div>
                <div className="detail-info-card">
                  <div className="detail-label"><PhoneIcon width={13} height={13} /> Contact</div>
                  <div className="detail-value">{selectedReport.contact || '—'}</div>
                </div>
                <div className="detail-info-card">
                  <div className="detail-label"><MapPinIcon width={13} height={13} /> Barangay</div>
                  <div className="detail-value">{selectedReport.barangay ? `Brgy. ${selectedReport.barangay}` : '—'}</div>
                </div>
                <div className="detail-info-card">
                  <div className="detail-label"><MapPinIcon width={13} height={13} /> Location Note</div>
                  <div className="detail-value">{selectedReport.location_note || '—'}</div>
                </div>
                <div className="detail-info-card" style={{ gridColumn: '1 / -1' }}>
                  <div className="detail-label"><ClockIcon width={13} height={13} /> Date Submitted</div>
                  <div className="detail-value">
                    {new Date(selectedReport.created_at).toLocaleDateString()} {new Date(selectedReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="detail-label" style={{ marginTop: 0 }}>Description</div>
              <div className="detail-description">{selectedReport.description}</div>

              {selectedReport.latitude && selectedReport.longitude && (
                <>
                  <div className="detail-label">Location</div>
                  <div className="detail-map">
                    <iframe
                      title="detail-report-map"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedReport.longitude - 0.006}%2C${selectedReport.latitude - 0.006}%2C${Number(selectedReport.longitude) + 0.006}%2C${Number(selectedReport.latitude) + 0.006}&layer=mapnik&marker=${selectedReport.latitude}%2C${selectedReport.longitude}`}
                    />
                  </div>
                </>
              )}

              {selectedReport.images && selectedReport.images.length > 0 && (
                <>
                  <div className="detail-label"><PhotoIcon width={13} height={13} /> Images</div>
                  <div className="report-images">
                    {selectedReport.images.map((img, i) => (
                      <a key={i} href={getImageUrl(img)} target="_blank" rel="noreferrer">
                        <img src={getImageUrl(img)} alt="report" />
                      </a>
                    ))}
                  </div>
                </>
              )}

              {selectedReport.videos && selectedReport.videos.length > 0 && (
                <>
                  <div className="detail-label"><VideoIcon width={13} height={13} /> Videos</div>
                  <div className="report-videos">
                    {selectedReport.videos.map((vid, i) => (
                      <video key={i} src={getImageUrl(vid)} controls preload="metadata" />
                    ))}
                  </div>
                </>
              )}

              <div className="trail-section">
                <div className="detail-label" style={{ marginTop: 0 }}>Turnover Trail</div>

                {!selectedReport.verifier && (!selectedReport.assignments || selectedReport.assignments.length === 0) && (
                  <div className="trail-none">Not yet reviewed by a verifier.</div>
                )}

                <div className="trail-timeline">
                  {selectedReport.verifier && (
                    <div className="trail-timeline-item">
                      <div className="trail-timeline-rail">
                        <span className="trail-timeline-dot" style={{ backgroundColor: '#6d28d9' }} />
                        {selectedReport.assignments && selectedReport.assignments.length > 0 && (
                          <span className="trail-timeline-line" />
                        )}
                      </div>
                      <div className="trail-timeline-content">
                        <div className="trail-verifier-line">
                          Verified by <strong>Verifier</strong>{' '}
                          on {new Date(selectedReport.verifier.verified_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReport.assignments && selectedReport.assignments.length > 0 && selectedReport.assignments.map((a, i) => {
                    const om = OFFICE_META[a.office_role];
                    const Icon = om?.Icon;
                    const isLast = i === selectedReport.assignments.length - 1;
                    return (
                      <div key={a.id} className="trail-timeline-item">
                        <div className="trail-timeline-rail">
                          <span className="trail-timeline-dot" style={{ backgroundColor: `var(--office-${a.office_role})` }} />
                          {!isLast && <span className="trail-timeline-line" />}
                        </div>
                        <div className="trail-timeline-content">
                          <div className="trail-assignment-card">
                            {Icon && <Icon width={15} height={15} />}
                            <span className={`badge badge-office-${a.office_role}`}>{om ? om.label : a.office_role}</span>
                            <span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status] || a.status}</span>
                            <span className="trail-assignment-card-note">{a.action_note || '—'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {selectedReport.verifier && (!selectedReport.assignments || selectedReport.assignments.length === 0) && (
                    <div className="trail-none" style={{ marginTop: 8 }}>No office assigned yet.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="action-buttons detail-modal-actions">
              <button
                className="btn-gray"
                onClick={() => { updateStatus(selectedReport.id, 'pending'); setSelectedReport(null); }}
                title="Manual override — normally status is driven by verifier/office actions"
              >
                Reset to Pending
              </button>
              <button
                className="btn-red"
                onClick={() => requestDelete(selectedReport)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete this report?"
        message={`This removes the report from ${deleteTarget?.name || 'this person'} permanently. This can't be undone.`}
        confirmLabel="Delete report"
        tone="danger"
        loading={deleting}
        requireReason
        reasonLabel="Reason (required for the audit log)"
        reasonPlaceholder="e.g. Duplicate of report"
        reasonValue={deleteReason}
        onReasonChange={setDeleteReason}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}