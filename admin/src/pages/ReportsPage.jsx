import { useEffect, useState } from 'react';
import axios from 'axios';
import Toast from '../components/Toast';
import { ShieldIcon, FlameIcon, CrossIcon } from '../components/Icons';
import './ReportsPage.css';

const API = 'http://localhost:5000';

const OFFICE_META = {
  police:  { label: 'Police',             Icon: ShieldIcon },
  bfp:     { label: 'BFP (Fire)',          Icon: FlameIcon },
  medical: { label: 'Medical / Ambulance', Icon: CrossIcon },
};

export default function ReportsPage() {
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
  }, []);

  // Uses the full trail endpoint: each report includes verifier + assignments
  async function fetchReports() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/reports/trail`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(res.data);
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to load reports.' });
    } finally {
      setLoading(false);
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
      <h1>Reports</h1>
      <p className="page-subtitle">Full trail: reporter → verifier → office action, in one place.</p>

      {/* Filter bar */}
      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name or description..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '260px' }}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
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
            <th>Contact</th>
            <th>Description</th>
            <th>Location Note</th>
            <th>Location Map</th>
            <th>Images</th>
            <th>Status</th>
            <th>Turnover</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="skeleton-row">
                <td colSpan="10"><div className="skeleton-bar" /></td>
              </tr>
            ))
          ) : filtered.length === 0 ? (
            <tr>
              <td colSpan="10">
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <div className="empty-state-title">No reports found</div>
                  <div className="empty-state-text">Try a different search or filter.</div>
                </div>
              </td>
            </tr>
          ) : (
            filtered.map(r => (
              <tr key={r.id} className="report-row" onClick={() => setSelectedReport(r)}>
                <td>{r.name || '—'}</td>
                <td>{r.contact || '—'}</td>
                <td className="report-description-cell">{r.description}</td>
                <td>{r.location_note || '—'}</td>
                <td onClick={e => e.stopPropagation()}>
                  {r.latitude && r.longitude ? (
                    <div
                      className="report-map"
                      onClick={() => setExpandedMap({ lat: r.latitude, lng: r.longitude })}
                      title="Click to view larger map"
                    >
                      <iframe
                        title={`report-${r.id}-map`}
                        src={`https://www.openstreetmap.org/export/embed.html?bbox=${r.longitude - 0.004}%2C${r.latitude - 0.004}%2C${Number(r.longitude) + 0.004}%2C${Number(r.latitude) + 0.004}&layer=mapnik&marker=${r.latitude}%2C${r.longitude}`}
                        loading="lazy"
                        style={{ pointerEvents: 'none' }}
                      />
                    </div>
                  ) : '—'}
                </td>
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
                <td>
                  <span className={`badge badge-${r.status}`}>{r.status}</span>
                </td>
                <td className="trail-cell" onClick={e => e.stopPropagation()}>
                  {r.verifier ? (
                    <>
                      <div className="trail-verifier-line">
                        Verified by <strong>{r.verifier.firstname} {r.verifier.lastname}</strong>
                      </div>
                      {r.assignments && r.assignments.length > 0 ? (
                        r.assignments.map(a => {
                          const om = OFFICE_META[a.office_role];
                          return (
                            <div key={a.id} className="trail-assignment-row">
                              <span className={`badge badge-office-${a.office_role}`}>
                                {om ? om.label : a.office_role}
                              </span>
                              <span className={`badge badge-${a.status}`}>{a.status}</span>
                              {a.action_note && <span className="trail-assignment-note" title={a.action_note}>{a.action_note}</span>}
                            </div>
                          );
                        })
                      ) : (
                        <div className="trail-none">No office assigned yet</div>
                      )}
                    </>
                  ) : (
                    <div className="trail-none">Awaiting verifier</div>
                  )}
                </td>
                <td>{new Date(r.created_at).toLocaleDateString()} {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="action-buttons">
                    <button className="btn-gray" onClick={() => setSelectedReport(r)}>
                      View
                    </button>
                    <button className="btn-red" onClick={() => deleteReport(r.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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
                    <a key={i} href={`${API}/uploads/${img}`} target="_blank" rel="noreferrer">
                      <img src={`${API}/uploads/${img}`} alt="report" />
                    </a>
                  ))}
                </div>
              </>
            )}

            <div className="trail-section">
              <div className="detail-label" style={{ marginTop: 0 }}>Turnover Trail</div>
              {selectedReport.verifier ? (
                <div className="trail-verifier-line" style={{ fontSize: 13 }}>
                  Verified by <strong>{selectedReport.verifier.firstname} {selectedReport.verifier.lastname}</strong>{' '}
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
