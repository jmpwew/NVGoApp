import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Toast from '../components/Toast';
import { ShieldIcon, FlameIcon, CrossIcon, MapPinIcon, PhotoIcon, VideoIcon } from '../components/Icons';
import './ReportsPage.css';

import { API } from '../config';
import { getImageUrl } from '../getImageUrl';

const OFFICE_META = {
  police:  { label: 'Police',             Icon: ShieldIcon },
  bfp:     { label: 'BFP (Fire)',          Icon: FlameIcon },
  medical: { label: 'Medical / Ambulance', Icon: CrossIcon },
};

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');  // all | pending | ongoing | resolved
  const [search, setSearch]     = useState('');
  const [expandedMap, setExpandedMap] = useState(null);     // { lat, lng } | null
  const [selectedReport, setSelectedReport] = useState(null); // full report object | null
  const [toast, setToast]       = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => fetchReports(true), 5000);
    return () => clearInterval(interval);
  }, []);

  // Coming from Dashboard's "Recent reports" -> /reports?reportId=123 opens
  // that specific report's detail modal directly instead of just the list.
  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (!reportId || reports.length === 0) return;

    const match = reports.find(r => String(r.id) === reportId);
    if (match) {
      setSelectedReport(match);
      // clear the query param so refreshing/closing doesn't reopen it
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, reports]);

  // Uses the full trail endpoint: each report includes verifier + assignments.
  // silent=true skips the loading-skeleton flash on background polls.
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

  // Manual override, kept for edge cases (e.g. false report). Normal flow moves
  // status automatically: pending -> ongoing (on verify) -> resolved (when every
  // assigned office resolves).
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

  async function deleteReport(id) {
    if (!confirm('Delete this report?')) return;
    try {
      await axios.delete(`${API}/api/admin/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(prev => prev.filter(r => r.id !== id));
      setToast({ type: 'success', text: 'Report deleted.' });
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to delete report.' });
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
          <p className="page-subtitle">Full trail: reporter → verifier → office action, in one place.</p>
        </div>
        <div className="live-chip">
          <span className={`live-chip-dot ${reports.filter(r => r.status === 'pending').length === 0 ? 'calm' : ''}`} />
          {loading ? 'Loading…' : `${reports.filter(r => r.status === 'pending').length} pending`}
        </div>
      </div>

      <div className="filter-pill-bar">
        {[
          { value: 'all',      label: 'All' },
          { value: 'pending',  label: 'Pending' },
          { value: 'ongoing',  label: 'Ongoing' },
          { value: 'resolved', label: 'Resolved' },
        ].map(opt => (
          <button
            key={opt.value}
            className={`filter-pill ${filter === opt.value ? 'active' : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
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
                  {r.contact && <span className="case-card-time">{r.contact}</span>}
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </div>
                <div className="case-card-desc">{r.description}</div>
                <div className="case-card-meta">
                  {r.location_note && (
                    <span
                      className="case-card-meta-item"
                      onClick={e => { if (r.latitude && r.longitude) { e.stopPropagation(); setExpandedMap({ lat: r.latitude, lng: r.longitude }); } }}
                      style={r.latitude && r.longitude ? { cursor: 'pointer' } : undefined}
                      title={r.latitude && r.longitude ? 'Click to view map' : undefined}
                    >
                      <MapPinIcon width={13} height={13} />{r.location_note}
                    </span>
                  )}
                  {r.images && r.images.length > 0 && (
                    <span className="case-card-meta-item"><PhotoIcon width={13} height={13} />{r.images.length}</span>
                  )}
                  {r.videos && r.videos.length > 0 && (
                    <span className="case-card-meta-item"><VideoIcon width={13} height={13} />{r.videos.length}</span>
                  )}
                  <span>{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="case-card-trail">
                  {r.verifier ? (
                    <>
                      <span className="case-card-trail-label">
                        Verified by Verifier
                      </span>
                      {r.assignments && r.assignments.length > 0 && r.assignments.map(a => {
                        const om = OFFICE_META[a.office_role];
                        return (
                          <span key={a.id} className="case-card-trail-office-group">
                            <span className={`badge badge-office-${a.office_role}`}>
                              {om ? om.label : a.office_role} · {a.status}
                            </span>
                            {a.action_note && (
                              <span className="case-card-office-note">{a.action_note}</span>
                            )}
                          </span>
                        );
                      })}
                    </>
                  ) : (
                    <span className="case-card-trail-label">Awaiting verifier</span>
                  )}
                </div>
              </div>
              <div className="action-buttons case-card-action" onClick={e => e.stopPropagation()}>
                <button className="btn-gray" onClick={() => setSelectedReport(r)}>View</button>
                <button className="btn-red" onClick={() => deleteReport(r.id)}>Delete</button>
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
            <button className="map-modal-close" onClick={() => setSelectedReport(null)}>
              ✕
            </button>

            <h2 className="detail-modal-title">Report Details</h2>
            <span className={`badge badge-${selectedReport.status}`}>{selectedReport.status}</span>

            <div className="detail-grid">
              <div>
                <div className="detail-label">Name</div>
                <div className="detail-value">{selectedReport.name || '—'}</div>
              </div>
              <div>
                <div className="detail-label">Contact</div>
                <div className="detail-value">{selectedReport.contact || '—'}</div>
              </div>
              <div>
                <div className="detail-label">Location Note</div>
                <div className="detail-value">{selectedReport.location_note || '—'}</div>
              </div>
              <div>
                <div className="detail-label">Date Submitted</div>
                <div className="detail-value">
                  {new Date(selectedReport.created_at).toLocaleDateString()} {new Date(selectedReport.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>

            <div className="detail-label">Description</div>
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
                <div className="detail-label">Images</div>
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
                <div className="detail-label">Videos</div>
                <div className="report-videos">
                  {selectedReport.videos.map((vid, i) => (
                    <video key={i} src={getImageUrl(vid)} controls preload="metadata" />
                  ))}
                </div>
              </>
            )}

            <div className="trail-section">
              <div className="detail-label" style={{ marginTop: 0 }}>Turnover Trail</div>
              {selectedReport.verifier ? (
                <div className="trail-verifier-line" style={{ fontSize: 13 }}>
                  Verified by <strong>Verifier</strong>{' '}
                  on {new Date(selectedReport.verifier.verified_at).toLocaleString()}
                </div>
              ) : (
                <div className="trail-none">Not yet reviewed by a verifier.</div>
              )}

              {selectedReport.assignments && selectedReport.assignments.length > 0 ? (
                <div className="trail-section-assignments">
                  {selectedReport.assignments.map(a => {
                    const om = OFFICE_META[a.office_role];
                    const Icon = om?.Icon;
                    return (
                      <div key={a.id} className="trail-assignment-card">
                        {Icon && <Icon width={16} height={16} />}
                        <span className={`badge badge-office-${a.office_role}`}>{om ? om.label : a.office_role}</span>
                        <span className={`badge badge-${a.status}`}>{a.status}</span>
                        <span className="trail-assignment-card-note">{a.action_note || '—'}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                selectedReport.verifier && <div className="trail-none" style={{ marginTop: 8 }}>No office assigned yet.</div>
              )}
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
                onClick={() => { deleteReport(selectedReport.id); setSelectedReport(null); }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}