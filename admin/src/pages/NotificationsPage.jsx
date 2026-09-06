import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

import { API } from '../config';
import ConfirmModal from '../components/ConfirmModal';

const TYPE_OPTIONS = [
  { value: 'info',   label: 'Info'   },
  { value: 'alert',  label: 'Alert'  },
  { value: 'update', label: 'Update' },
  { value: 'report', label: 'Report' },
];

const TYPE_BADGE = {
  info:   { bg: '#e8f4fd', color: '#1a73e8' },
  alert:  { bg: '#fff8e1', color: '#f59e0b' },
  update: { bg: '#e8f5e9', color: '#16a34a' },
  report: { bg: '#e8f4fd', color: '#1a73e8' },
};

const EMPTY_FORM = { title: '', body: '', type: 'info', user_id: '' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [errorMsg, setErrorMsg]           = useState('');
  const [showForm, setShowForm]           = useState(false); 
  const [viewing, setViewing]             = useState(null);  
  const [editingId, setEditingId]         = useState(null);  

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notifications;
    return notifications.filter(n =>
      (n.title || '').toLowerCase().includes(q) ||
      (n.body || '').toLowerCase().includes(q) ||
      (n.type || '').toLowerCase().includes(q) ||
      getUserNamePlain(n.user_id, users).toLowerCase().includes(q)
    );
  }, [notifications, users, search]);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [nRes, uRes] = await Promise.all([
        axios.get(`${API}/api/admin/notifications`, { headers }),
        axios.get(`${API}/api/admin/users`,         { headers }),
      ]);
      setNotifications(nRes.data);
      setUsers(uRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function startEdit(n) {
    setViewing(null);
    setEditingId(n.id);
    setForm({
      title:   n.title || '',
      body:    n.body || '',
      type:    n.type || 'info',
      user_id: n.user_id || '',
    });
    setErrorMsg('');
    setShowForm(true);
  }

  function openSendForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMsg('');
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
    setErrorMsg('');
    setSending(false);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setErrorMsg('Title and message are required.');
      return;
    }
    setSending(true);
    setErrorMsg('');
    try {
      const payload = {
        title:   form.title.trim(),
        body:    form.body.trim(),
        type:    form.type,
        user_id: form.user_id || null,
      };

      if (editingId) {
        await axios.put(`${API}/api/admin/notifications/${editingId}`, payload, { headers });
      } else {
        await axios.post(`${API}/api/admin/notifications`, payload, { headers });
      }

      cancelForm();
      fetchAll();
    } catch (err) {
      console.error(err);
      setErrorMsg(editingId ? 'Failed to update notification.' : 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(`${API}/api/admin/notifications/${deleteTarget.id}`, { headers });
      setNotifications(prev => prev.filter(n => n.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) cancelForm(); 
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      setDeleteError('Failed to delete notification.');
    } finally {
      setDeleting(false);
    }
  }

  function getUserName(userId) {
    if (!userId) return <span style={badgeStyle('#f3f4f6', '#6b7280')}>All Users (Broadcast)</span>;
    const u = users.find(u => u.id === userId);
    return u ? `${u.firstname} ${u.lastname}` : `User #${userId}`;
  }

  function truncate(str, maxLen) {
    if (!str) return '';
    return str.length > maxLen ? `${str.slice(0, maxLen)}…` : str;
  }

  return (
    <div className="page notifications-page">
      {/* Scoped styles for this page — table sits inside a .card wrapper
          (see index.css), so it should be flush/borderless, clipped to the
          card's own radius. Mirrors the pattern used on HotlinesPage. */}
      <style>{`
        .notifications-page .card {
          overflow: hidden;
        }
        .notifications-page .card > table {
          border-radius: 0;
          box-shadow: none;
          table-layout: fixed;
        }
        .notifications-page .card > table thead th:first-child,
        .notifications-page .card > table tbody td:first-child {
          padding-left: 20px;
        }
        .notifications-page .card > table thead th:last-child,
        .notifications-page .card > table tbody td:last-child {
          padding-right: 20px;
        }
      `}</style>

      <div className="page-header-row">
        <div>
          <h1>Notifications</h1>
          <p className="page-subtitle">
            Send announcements, alerts, or updates to all users or a specific user.
          </p>
        </div>
        <button className="btn-green" onClick={openSendForm}>
          + Send Notification
        </button>
      </div>

      {/* ── Notification History ── */}
      <div className="filter-pill-bar">
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Search by title, message, type, or recipient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="filter-pill-count">{filtered.length} notification{filtered.length === 1 ? '' : 's'}</span>
      </div>

      <div className="card notifications-card" style={{ padding: 0 }}>
        {loading ? (
          <table>
            <tbody>
              {[...Array(4)].map((_, i) => (
                <tr key={i} className="skeleton-row">
                  <td colSpan="6"><div className="skeleton-bar" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔔</div>
            <div className="empty-state-title">
              {notifications.length === 0 ? 'No notifications sent yet' : 'No notifications match your search'}
            </div>
            <div className="empty-state-text">
              {notifications.length === 0
                ? 'Notifications you send will show up here.'
                : 'Try a different title, message, or recipient.'}
            </div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 80 }}>Type</th>
                <th style={{ width: 160 }}>Title</th>
                <th style={{ width: 320 }}>Message</th>
                <th style={{ width: 170 }}>Recipient</th>
                <th style={{ width: 150 }}>Sent At</th>
                <th style={{ width: 130 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(n => {
                const tb = TYPE_BADGE[n.type] ?? TYPE_BADGE.info;
                return (
                  <tr
                    key={n.id}
                    onClick={() => setViewing(n)}
                    style={{ cursor: 'pointer', background: editingId === n.id ? '#f1f8f4' : undefined }}
                    title="Click to view full notification"
                  >
                    <td>
                      <span style={badgeStyle(tb.bg, tb.color)}>
                        {n.type}
                      </span>
                    </td>
                    <td style={cellClampStyle(600)}>{truncate(n.title, 40)}</td>
                    <td style={cellClampStyle(400, '#374151')}>
                      {truncate(n.body, 80)}
                    </td>
                    <td style={cellClampStyle(400)}>{getUserName(n.user_id)}</td>
                    <td>{new Date(n.created_at).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-gray"
                          onClick={(e) => { e.stopPropagation(); startEdit(n); }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-red"
                          onClick={(e) => { e.stopPropagation(); setDeleteError(''); setDeleteTarget(n); }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Send / Edit modal ── */}
      {showForm && (
        <div style={modalOverlayStyle} onClick={cancelForm}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111', margin: '0 0 18px' }}>
              {editingId ? `Edit Notification #${editingId}` : 'Send a Notification'}
            </h2>

            {errorMsg && (
              <div style={alertStyle('#fee2e2', '#dc2626')}>{errorMsg}</div>
            )}

            <form onSubmit={handleSend}>
              <div style={rowStyle}>
                {/* Recipient */}
                <div style={fieldStyle}>
                  <label style={labelStyle}>Recipient</label>
                  <select
                    name="user_id"
                    value={form.user_id}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    <option value="">All Users (Broadcast)</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.firstname} {u.lastname} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Type */}
                <div style={{ ...fieldStyle, maxWidth: 160 }}>
                  <label style={labelStyle}>Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    style={inputStyle}
                  >
                    {TYPE_OPTIONS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Title</label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="e.g. Typhoon Advisory"
                  maxLength={255}
                  style={inputStyle}
                />
              </div>

              {/* Message */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Message</label>
                <textarea
                  name="body"
                  value={form.body}
                  onChange={handleChange}
                  placeholder="Write your notification message here..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="submit"
                  disabled={sending}
                  style={sendBtnStyle(sending)}
                >
                  {sending
                    ? (editingId ? 'Saving…' : 'Sending…')
                    : (editingId ? 'Save Changes' : 'Send Notification')}
                </button>
                <button type="button" onClick={cancelForm} style={secondaryBtnStyle} disabled={sending}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Full Notification Modal ── */}
      {viewing && (
        <div style={modalOverlayStyle} onClick={() => setViewing(null)}>
          <div style={modalCardStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <span style={badgeStyle(
                (TYPE_BADGE[viewing.type] ?? TYPE_BADGE.info).bg,
                (TYPE_BADGE[viewing.type] ?? TYPE_BADGE.info).color
              )}>
                {viewing.type}
              </span>
              <button
                onClick={() => setViewing(null)}
                aria-label="Close"
                style={modalCloseBtnStyle}
              >
                ✕
              </button>
            </div>

            <h3 style={{ margin: '14px 0 4px', fontSize: 18, color: '#111', wordBreak: 'break-word' }}>
              {viewing.title}
            </h3>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16 }}>
              {new Date(viewing.created_at).toLocaleString()} · To: {' '}
              {viewing.user_id
                ? (users.find(u => u.id === viewing.user_id)
                    ? `${users.find(u => u.id === viewing.user_id).firstname} ${users.find(u => u.id === viewing.user_id).lastname}`
                    : `User #${viewing.user_id}`)
                : 'All Users (Broadcast)'}
            </div>

            <div style={modalBodyTextStyle}>
              {viewing.body}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button
                style={{ ...sendBtnStyle(false), flex: 'none' }}
                onClick={() => startEdit(viewing)}
              >
                Edit
              </button>
              <button
                style={secondaryBtnStyle}
                onClick={() => setViewing(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Delete this notification?"
        message={
          deleteError
            ? deleteError
            : deleteTarget
              ? `This will permanently delete "${deleteTarget.title}". This action cannot be undone.`
              : ''
        }
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => { setDeleteTarget(null); setDeleteError(''); }}
      />
    </div>
  );
}


function getUserNamePlain(userId, users) {
  if (!userId) return 'All Users (Broadcast)';
  const u = users.find(u => u.id === userId);
  return u ? `${u.firstname} ${u.lastname}` : `User #${userId}`;
}

const rowStyle   = { display: 'flex', gap: 16, flexWrap: 'wrap' };
const fieldStyle = { display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14, flex: 1, minWidth: 200 };
const labelStyle = { fontSize: 13, fontWeight: 600, color: '#374151' };
const inputStyle = {
  padding: '8px 10px',
  border: '1px solid #d1d5db',
  borderRadius: 6,
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  background: '#fff',
};
const sendBtnStyle = (disabled) => ({
  marginTop: 4,
  padding: '9px 20px',
  background: disabled ? '#9ca3af' : '#16a34a',
  color: '#fff',
  border: 'none',
  borderRadius: 7,
  fontWeight: 700,
  fontSize: 14,
  cursor: disabled ? 'not-allowed' : 'pointer',
});
const secondaryBtnStyle = {
  marginTop: 4,
  padding: '9px 20px',
  background: '#fff',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: 7,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
};
function alertStyle(bg, color) {
  return {
    background: bg, color, border: `1px solid ${color}33`,
    borderRadius: 7, padding: '9px 14px', fontSize: 13,
    fontWeight: 600, marginBottom: 14,
  };
}
function badgeStyle(bg, color) {
  return {
    background: bg, color,
    borderRadius: 999, padding: '2px 10px',
    fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    display: 'inline-block',
  };
}


function cellClampStyle(fontWeight = 400, color = '#111') {
  return {
    fontWeight,
    color,
    fontSize: 13,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };
}

const modalOverlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 200,
  padding: 20,
};

const modalCardStyle = {
  background: '#fff',
  borderRadius: 12,
  padding: '22px 26px',
  width: '100%',
  maxWidth: 480,
  maxHeight: '80vh',
  overflowY: 'auto',
  boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
};

const modalCloseBtnStyle = {
  background: 'none',
  border: 'none',
  fontSize: 16,
  color: '#9ca3af',
  cursor: 'pointer',
  lineHeight: 1,
  padding: 4,
};

const modalBodyTextStyle = {
  fontSize: 14,
  color: '#374151',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
  wordBreak: 'break-word',
  lineHeight: 1.5,
};