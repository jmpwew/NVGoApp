import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { ShieldIcon, FlameIcon, CrossIcon, MapPinIcon, ClockIcon, UserIcon, PhoneIcon, PhotoIcon, VideoIcon, AlertTriangleIcon, CloseIcon, BellIcon, BellOffIcon } from '../components/Icons';
import QuarterlyLogsModal from '../components/QuarterlyLogsModal';
import playNotificationSound, { playUrgentAlertSound } from '../playNotificationSound';
import './OfficeDashboard.css';
import './ReportsPage.css'; 
import { API } from '../config';
import { getImageUrl } from '../getImageUrl';

const OFFICE_META = {
  police:  { label: 'Police',               Icon: ShieldIcon, className: 'police' },
  bfp:     { label: 'BFP (Fire)',            Icon: FlameIcon,  className: 'bfp' },
  medical: { label: 'MDRRMO',   Icon: CrossIcon,  className: 'medical' },
};

const STATUS_LABELS = {
  ongoing:    'Ongoing',
  dispatched: 'Unit Dispatched',  
  resolved:   'Resolved',
};

// Minutes since assignment before the elapsed-time badge switches to
// "warning" and then "critical" — urgent reports get a much tighter clock.
const SLA_MINUTES = {
  urgent: { warning: 5,  critical: 15 },
  normal: { warning: 20, critical: 60 },
};

const MUTE_STORAGE_KEY = 'office_alert_muted';

function elapsedMinutes(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / 60000;
}

// Returns 'ok' | 'warning' | 'critical' for how overdue an active
// assignment is against its SLA. Resolved reports never warn — the clock
// stops once someone has acted on it.
function slaTier(a) {
  if (a.assignment_status === 'resolved') return 'ok';
  const sla = a.is_urgent ? SLA_MINUTES.urgent : SLA_MINUTES.normal;
  const mins = elapsedMinutes(a.assigned_at);
  if (mins >= sla.critical) return 'critical';
  if (mins >= sla.warning) return 'warning';
  return 'ok';
}

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
  const [filter, setFilter]           = useState('ongoing'); 
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const PAGE_SIZE = 10;
  const [selected, setSelected]       = useState(null);
  const [note, setNote]               = useState('');
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); 
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [muted, setMuted] = useState(() => localStorage.getItem(MUTE_STORAGE_KEY) === '1');
  const [newAlerts, setNewAlerts] = useState([]);
  const seenIdsRef = useRef(null); // null until first fetch completes, then a Set of known assignment_ids
  const mutedRef = useRef(muted);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

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


  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (!reportId || assignments.length === 0) return;

    const match = assignments.find(a => String(a.id) === reportId);
    if (match) {
      openAssignment(match);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, assignments]);


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
      const data = res.data;

      if (seenIdsRef.current === null) {
        // First load: just remember what's already here, don't alert on it.
        seenIdsRef.current = new Set(data.map(a => a.assignment_id));
      } else {
        const freshOnes = data.filter(a => !seenIdsRef.current.has(a.assignment_id));
        if (freshOnes.length > 0) {
          freshOnes.forEach(a => seenIdsRef.current.add(a.assignment_id));
          freshOnes.forEach(a => triggerNewReportAlert(a));
        }
      }

      setAssignments(data);
    } catch (err) {
      console.log(err);
      if (!silent) setToast({ type: 'error', text: 'Failed to load assigned reports.' });
    } finally {
      if (!silent) setLoading(false);
    }
  }

  // Fires the audible + visual "new report" indicator for a just-arrived
  // assignment, whether or not it's flagged urgent — mute only affects sound.
  // Stays visible until the office actually opens that report (see
  // openAssignment below) — it does not auto-dismiss on a timer.
  function triggerNewReportAlert(a) {
    const alertId = `${a.assignment_id}-${Date.now()}`;
    setNewAlerts(prev => [...prev, { ...a, alertId }]);

    if (!mutedRef.current) {
      if (a.is_urgent) playUrgentAlertSound();
      else playNotificationSound();
    }
  }

  function toggleMute() {
    setMuted(prev => {
      const next = !prev;
      localStorage.setItem(MUTE_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }

  function openAssignment(a) {
    setSelected(a);
    setNote(a.action_note || '');
    // Opening a report is what clears its "new report" alert(s).
    setNewAlerts(prev => prev.filter(x => x.assignment_id !== a.assignment_id));
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

  const isActiveUrgent = a => a.is_urgent && a.assignment_status !== 'resolved';

  const filtered = assignments
    .filter(a => {
      const matchesStatus = filter === 'urgent' ? isActiveUrgent(a) : a.assignment_status === filter;
      const q = search.toLowerCase();
      const matchesSearch = !q ||
        a.name?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.location_note?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    })
    // Pin active urgent reports above everything else; stable sort keeps
    // the existing order within each group otherwise.
    .sort((a, b) => (isActiveUrgent(a) ? 0 : 1) - (isActiveUrgent(b) ? 0 : 1));

  const ongoingCount    = assignments.filter(a => a.assignment_status === 'ongoing').length;
  const dispatchedCount = assignments.filter(a => a.assignment_status === 'dispatched').length;
  const resolvedCount   = assignments.filter(a => a.assignment_status === 'resolved').length;
  const urgentCount     = assignments.filter(isActiveUrgent).length;

  const freshIds = new Set(newAlerts.map(a => a.assignment_id));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className={`page office-scope-${meta.className}`}>
      <div className="office-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className={`office-header-icon ${meta.className}`}>
            <meta.Icon width={22} height={22} />
          </div>
          <div>
            <h1>{meta.label} — Response Console</h1>
            <div className="office-header-subtitle">Reports assigned to your office appear here</div>
          </div>
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
          <QuarterlyLogsModal endpoint={`${API}/api/office/reports/quarterly`} />
        </div>
      </div>

      {newAlerts.length > 0 && (
        <div className="new-report-alerts">
          {newAlerts.map(a => (
            <div key={a.alertId} className={`new-report-banner ${a.is_urgent ? 'is-urgent' : 'is-normal'}`}>
              <span className="new-report-banner-icon"><AlertTriangleIcon width={16} height={16} /></span>
              <span className="new-report-banner-text">
                {a.is_urgent ? 'New urgent report' : 'New report assigned'} — {a.name || 'Anonymous'}
                {a.barangay ? `, Brgy. ${a.barangay}` : ''}
              </span>
              <button
                className="new-report-banner-view"
                onClick={() => openAssignment(a)}
              >
                View report
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-card-label">Total assigned</div>
          <div className="metric-card-value">{assignments.length}</div>
        </div>
        <div className={`metric-card office-metric-ongoing office-metric-ongoing-${meta.className}`}>
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

      <div className="report-tabs">
        {[
          { value: 'urgent',     label: 'Urgent queue',    count: urgentCount, urgent: true },
          { value: 'ongoing',    label: 'Ongoing',         count: ongoingCount },
          { value: 'dispatched', label: 'Unit Dispatched', count: dispatchedCount },
          { value: 'resolved',   label: 'Resolved',        count: resolvedCount },
        ].map(opt => (
          <button
            key={opt.value}
            className={`report-tab ${opt.urgent ? 'report-tab-urgent' : ''} ${filter === opt.value ? 'active' : ''}`}
            onClick={() => setFilter(opt.value)}
          >
            {opt.urgent && <AlertTriangleIcon width={13} height={13} />}
            {opt.label} <span className="report-tab-count">{opt.count}</span>
          </button>
        ))}
      </div>

      <div className="filter-pill-bar">
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
              className={`case-card ${a.assignment_status === 'resolved' ? 'is-resolved' : ''} ${freshIds.has(a.assignment_id) ? 'is-fresh' : ''}`}
              onClick={() => openAssignment(a)}
            >
              <div className={`case-card-stripe status-${a.assignment_status}`} />
              <div className="avatar-circle">{initials(a.name)}</div>
              <div className="case-card-body">
                <div className="case-card-top">
                  <span className="case-card-name">{a.name || 'Anonymous'}</span>
                  <span className={`badge badge-${a.assignment_status}`}>{STATUS_LABELS[a.assignment_status] || a.assignment_status}</span>
                  {a.is_urgent && <span className="badge badge-urgent">Urgent</span>}
                </div>
                <div className="case-card-desc">{a.description}</div>
                <div className="case-card-meta">
                  {a.barangay && (
                    <span className="case-card-meta-item"><MapPinIcon width={13} height={13} />Brgy. {a.barangay}</span>
                  )}
                  {a.location_note && (
                    <span className="case-card-meta-item">{!a.barangay && <MapPinIcon width={13} height={13} />}{a.location_note}</span>
                  )}
                  {a.action_note && (
                    <span className="case-card-meta-item"><ClockIcon width={13} height={13} />{a.action_note}</span>
                  )}
                </div>
              </div>
              {slaTier(a) !== 'ok' ? (
                <span className={`sla-badge tier-${slaTier(a)}`}>
                  <ClockIcon width={12} height={12} />
                  {Math.round(elapsedMinutes(a.assigned_at))}m — SLA {slaTier(a) === 'critical' ? 'critical' : 'exceeded'}
                </span>
              ) : (
                <span className="case-card-time">
                  {a.assignment_status === 'ongoing'
                    ? timeAgo(a.assigned_at)
                    : <>updated {timeAgo(a.updated_at)}</>}
                </span>
              )}
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
            <div className="detail-modal-header">
              <div className="detail-modal-header-top">
                <h2 className="detail-modal-title">Report Details</h2>
                <button className="detail-modal-close" onClick={() => setSelected(null)} aria-label="Close">
                  <CloseIcon width={14} height={14} />
                </button>
              </div>
              <div className="detail-modal-badges">
                <span className={`badge badge-${selected.assignment_status}`}>{STATUS_LABELS[selected.assignment_status] || selected.assignment_status}</span>
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
                <div className="detail-info-card">
                  <div className="detail-label"><ClockIcon width={13} height={13} /> Date Assigned</div>
                  <div className="detail-value">
                    {new Date(selected.assigned_at).toLocaleString()}
                    {slaTier(selected) !== 'ok' && (
                      <div style={{ marginTop: 6 }}>
                        <span className={`sla-badge tier-${slaTier(selected)}`}>
                          <ClockIcon width={12} height={12} />
                          {Math.round(elapsedMinutes(selected.assigned_at))}m — SLA {slaTier(selected) === 'critical' ? 'critical' : 'exceeded'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {selected.assignment_status !== 'ongoing' && (
                  <div className="detail-info-card">
                    <div className="detail-label"><ClockIcon width={13} height={13} /> Last Updated</div>
                    <div className="detail-value">{new Date(selected.updated_at).toLocaleString()}</div>
                  </div>
                )}
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
                      title="office-report-map"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${selected.longitude - 0.006}%2C${selected.latitude - 0.006}%2C${Number(selected.longitude) + 0.006}%2C${Number(selected.latitude) + 0.006}&layer=mapnik&marker=${selected.latitude}%2C${selected.longitude}`}
                    />
                  </div>
                </>
              )}

              <div className="detail-label" style={{ marginTop: 16 }}>Action note (Visible to users)</div>
              <textarea
                className="office-note-textarea"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Unit dispatched, arrived on scene..."
                rows={3}
              />
              <div className="office-note-hint"></div>
            </div>

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