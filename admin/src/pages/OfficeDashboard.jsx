import { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { ShieldIcon, FlameIcon, CrossIcon, MapPinIcon, ClockIcon } from '../components/Icons';
import './OfficeDashboard.css';
import './ReportsPage.css'; 
import { API } from '../config';
import { getImageUrl } from '../getImageUrl';

const OFFICE_META = {
  police:  { label: 'Police',               Icon: ShieldIcon, className: 'police' },
  bfp:     { label: 'BFP (Fire)',            Icon: FlameIcon,  className: 'bfp' },
  medical: { label: 'Medical / Ambulance',   Icon: CrossIcon,  className: 'medical' },
};

const STATUS_LABELS = {
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

export default function OfficeDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('ongoing'); // ongoing | dispatched | resolved
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const PAGE_SIZE = 10;
  const [selected, setSelected]       = useState(null);
  const [note, setNote]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); 
  const [statusUpdating, setStatusUpdating] = useState(false);

  const token = localStorage.getItem('token');
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');
  const meta  = OFFICE_META[admin.role] || { label: admin.role, Icon: ShieldIcon, className: 'police' };

  useEffect(() => {
    fetchAssignments();

    const interval = setInterval(() => fetchAssignments(true), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  // Coming from a bell notification -> /office?reportId=123 opens that
  // specific assignment directly instead of just landing on the list.
  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (!reportId || assignments.length === 0) return;

    const match = assignments.find(a => String(a.id) === reportId);
    if (match) {
      openAssignment(match);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, assignments]);

  // Esc closes the detail modal, same as clicking outside it or the ✕.
  // Skipped while the confirm dialog is open on top of it — that has its
  // own Esc handling, and we don't want one keypress to close both at once.
  useEffect(() => {
    if (!selected || confirmAction) return;
    function handleKeyDown(e) {
      if (e.key === 'Escape') setSelected(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selected, confirmAction]);

  async function fetchAssignments(silent = false) {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${API}/api/office/assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignments(res.data);
    } catch (err) {
      console.log(err);
      if (!silent) setToast({ type: 'error', text: 'Failed to load assigned reports.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }

  function openAssignment(a) {
    setSelected(a);
    setNote(a.action_note || '');
  }

  async function performUpdateStatus(assignmentId, status, fromStatus) {
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
      setToast({
        type: 'success',
        text: status === 'resolved'
          ? 'Marked as resolved.'
          : status === 'dispatched' && fromStatus === 'ongoing'
            ? 'Unit dispatched.'
            : status === 'dispatched'
              ? 'Reverted to Unit Dispatched.'
              : 'Status updated.'
      });
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to update status.' });
    }
  }

  function updateStatus(assignmentId, status, fromStatus) {
    setConfirmAction({ assignmentId, status, fromStatus });
  }

  async function handleConfirmStatusChange() {
    if (!confirmAction) return;
    setStatusUpdating(true);
    await performUpdateStatus(confirmAction.assignmentId, confirmAction.status, confirmAction.fromStatus);
    setStatusUpdating(false);
    setConfirmAction(null);
  }

  // Saves the action note AND advances the status to 'dispatched' in a single request.
  // Used by the "Dispatch Unit" button, which only appears while status is 'ongoing'.
  async function dispatchUnit(assignmentId) {
    setSaving(true);
    try {
      const res = await axios.put(
        `${API}/api/office/assignments/${assignmentId}`,
        { action_note: note, status: 'dispatched' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignments(prev =>
        prev.map(a => a.assignment_id === assignmentId
          ? { ...a, action_note: res.data.action_note, assignment_status: res.data.status }
          : a)
      );
      setSelected(null);
      setToast({ type: 'success', text: 'Unit dispatched.' });
    } catch (err) {
      console.log(err);
      setToast({ type: 'error', text: 'Failed to dispatch unit.' });
    } finally {
      setSaving(false);
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

  const filtered = assignments.filter(a => {
    const matchesStatus = a.assignment_status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      a.name?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q) ||
      a.location_note?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });
  const ongoingCount    = assignments.filter(a => a.assignment_status === 'ongoing').length;
  const dispatchedCount = assignments.filter(a => a.assignment_status === 'dispatched').length;
  const resolvedCount   = assignments.filter(a => a.assignment_status === 'resolved').length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="page">
      <div className="office-header">
        <div className={`office-header-icon ${meta.className}`}>
          <meta.Icon width={22} height={22} />
        </div>
        <div>
          <h1>{meta.label} — response console</h1>
          
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-card-label">Total assigned</div>
          <div className="metric-card-value">{assignments.length}</div>
        </div>
        <div className={`metric-card office-metric-ongoing-${meta.className}`}>
          <div className="metric-card-label">Ongoing</div>
          <div className="metric-card-value">{ongoingCount}</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">Unit Dispatched</div>
          <div className="metric-card-value">{dispatchedCount}</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">Resolved</div>
          <div className="metric-card-value">{resolvedCount}</div>
        </div>
      </div>

      <div className="filter-pill-bar">
        {[
          { value: 'ongoing',    label: 'Ongoing' },
          { value: 'dispatched', label: 'Unit Dispatched' },
          { value: 'resolved',   label: 'Resolved' },
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
            placeholder="Search by name, description, or location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="filter-pill-count">{filtered.length} report(s)</span>
      </div>

      {loading ? (
        <div className="case-card-list">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton-row"><div className="skeleton-bar" /></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">
            {assignments.length === 0 ? 'No reports assigned' : 'No matching reports'}
          </div>
          <div className="empty-state-text">
            {assignments.length === 0
              ? 'Reports the verifier sends to your office will appear here.'
              : 'Try a different search term or filter.'}
          </div>
        </div>
      ) : (
        <div className="case-card-list">
          {paginated.map(a => (
            <div
              key={a.assignment_id}
              className={`case-card ${a.assignment_status === 'resolved' ? 'is-resolved' : ''}`}
              onClick={() => openAssignment(a)}
            >
              <div className={`case-card-stripe status-${a.assignment_status}`} />
              <div className="avatar-circle">{initials(a.name)}</div>
              <div className="case-card-body">
                <div className="case-card-top">
                  <span className="case-card-name">{a.name || 'Anonymous'}</span>
                  <span className={`badge badge-${a.assignment_status}`}>{STATUS_LABELS[a.assignment_status] || a.assignment_status}</span>
                </div>
                <div className="case-card-desc">{a.description}</div>
                <div className="case-card-meta">
                  {a.location_note && (
                    <span className="case-card-meta-item"><MapPinIcon width={13} height={13} />{a.location_note}</span>
                  )}
                  {a.action_note && (
                    <span className="case-card-meta-item"><ClockIcon width={13} height={13} />{a.action_note}</span>
                  )}
                </div>
              </div>
              <span className="case-card-time">
                {a.assignment_status === 'ongoing'
                  ? timeAgo(a.assigned_at)
                  : <>updated {timeAgo(a.updated_at)}</>}
              </span>
              <div className="case-card-action" onClick={e => e.stopPropagation()}>
                {a.assignment_status === 'ongoing' ? (
                  <button className="btn-green" onClick={() => updateStatus(a.assignment_id, 'dispatched', 'ongoing')}>
                    Dispatch
                  </button>
                ) : a.assignment_status === 'dispatched' ? (
                  <button className="btn-green" onClick={() => updateStatus(a.assignment_id, 'resolved', 'dispatched')}>
                    Resolve
                  </button>
                ) : a.assignment_status === 'resolved' ? (
                  <button className="btn-gray" onClick={() => updateStatus(a.assignment_id, 'dispatched', 'resolved')}>
                    Cancel resolve
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
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

            <h2 className="detail-modal-title">Report Details</h2>
            <span className={`badge badge-${selected.assignment_status}`}>{STATUS_LABELS[selected.assignment_status] || selected.assignment_status}</span>

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
              {selected.assignment_status !== 'ongoing' && (
                <div>
                  <div className="detail-label">Last Updated</div>
                  <div className="detail-value">{new Date(selected.updated_at).toLocaleString()}</div>
                </div>
              )}
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
              {selected.assignment_status === 'ongoing' ? (
                <button className="btn-green" onClick={() => dispatchUnit(selected.assignment_id)} disabled={saving}>
                  {saving ? <><span className="spinner" /> Dispatching...</> : 'Dispatch Unit'}
                </button>
              ) : (
                <button className="btn-green" onClick={() => saveNote(selected.assignment_id)} disabled={saving}>
                  {saving ? <><span className="spinner" /> Saving...</> : 'Save Note'}
                </button>
              )}
              {selected.assignment_status === 'dispatched' && (
                <button className="btn-gray" onClick={() => updateStatus(selected.assignment_id, 'resolved', 'dispatched')}>
                  Mark Resolved
                </button>
              )}
              {selected.assignment_status === 'resolved' && (
                <button className="btn-gray" onClick={() => updateStatus(selected.assignment_id, 'dispatched', 'resolved')}>
                  Cancel Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!confirmAction}
        title={
          confirmAction?.status === 'resolved'
            ? 'Mark this report as resolved?'
            : confirmAction?.status === 'dispatched' && confirmAction?.fromStatus === 'ongoing'
              ? 'Dispatch a unit to this report?'
              : confirmAction?.status === 'dispatched'
                ? 'Revert this report to Unit Dispatched?'
                : 'Mark this report as ongoing?'
        }
        confirmLabel={
          confirmAction?.status === 'resolved'
            ? 'Resolve'
            : confirmAction?.status === 'dispatched' && confirmAction?.fromStatus === 'ongoing'
              ? 'Dispatch'
              : 'Yes, revert'
        }
        loading={statusUpdating}
        onConfirm={handleConfirmStatusChange}
        onCancel={() => setConfirmAction(null)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}