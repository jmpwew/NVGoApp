import { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

const TYPE_OPTIONS = [
  { value: 'info',   label: 'ℹ️  Info'   },
  { value: 'alert',  label: '⚠️  Alert'  },
  { value: 'update', label: '✅  Update' },
  { value: 'report', label: '📋  Report' },
];

const TYPE_BADGE = {
  info:   { bg: '#e8f4fd', color: '#1a73e8' },
  alert:  { bg: '#fff8e1', color: '#f59e0b' },
  update: { bg: '#e8f5e9', color: '#16a34a' },
  report: { bg: '#e8f4fd', color: '#1a73e8' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [users, setUsers]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [sending, setSending]             = useState(false);
  const [successMsg, setSuccessMsg]       = useState('');
  const [errorMsg, setErrorMsg]           = useState('');

  const [form, setForm] = useState({
    title:   '',
    body:    '',
    type:    'info',
    user_id: '',   // empty = broadcast to all
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

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

  async function handleSend(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) {
      setErrorMsg('Title and message are required.');
      return;
    }
    setSending(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        title:   form.title.trim(),
        body:    form.body.trim(),
        type:    form.type,
        user_id: form.user_id || null,
      };
      await axios.post(`${API}/api/admin/notifications`, payload, { headers });
      setSuccessMsg(
        payload.user_id
          ? `Notification sent to user #${payload.user_id}.`
          : 'Broadcast notification sent to all users.'
      );
      setForm({ title: '', body: '', type: 'info', user_id: '' });
      fetchAll();
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to send notification.');
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this notification?')) return;
    try {
      await axios.delete(`${API}/api/admin/notifications/${id}`, { headers });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete notification.');
    }
  }

  function getUserName(userId) {
    if (!userId) return <span style={badgeStyle('#f3f4f6', '#6b7280')}>All Users (Broadcast)</span>;
    const u = users.find(u => u.id === userId);
    return u ? `${u.firstname} ${u.lastname}` : `User #${userId}`;
  }

  return (
    <div className="page">
      <h1>Notifications</h1>
      <p style={{ color: '#6b7280', marginTop: -8, marginBottom: 24, fontSize: 14 }}>
        Send announcements, alerts, or updates to all users or a specific user.
      </p>

      {/* ── Send Form ── */}
      <div style={formCardStyle}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 18, color: '#111' }}>
          Send a Notification
        </h2>

        {successMsg && (
          <div style={alertStyle('#dcfce7', '#16a34a')}>{successMsg}</div>
        )}
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
                <option value="">📢 All Users (Broadcast)</option>
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

          <button
            type="submit"
            disabled={sending}
            style={sendBtnStyle(sending)}
          >
            {sending ? 'Sending…' : '🔔 Send Notification'}
          </button>
        </form>
      </div>

      {/* ── Notification History ── */}
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '28px 0 12px', color: '#111' }}>
        Notification History
      </h2>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : notifications.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No notifications sent yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Type</th>
              <th>Title</th>
              <th>Message</th>
              <th>Recipient</th>
              <th>Sent At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map(n => {
              const tb = TYPE_BADGE[n.type] ?? TYPE_BADGE.info;
              return (
                <tr key={n.id}>
                  <td>#{n.id}</td>
                  <td>
                    <span style={badgeStyle(tb.bg, tb.color)}>
                      {n.type}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{n.title}</td>
                  <td style={{ maxWidth: 280, whiteSpace: 'pre-wrap', fontSize: 13, color: '#374151' }}>
                    {n.body}
                  </td>
                  <td>{getUserName(n.user_id)}</td>
                  <td>{new Date(n.created_at).toLocaleString()}</td>
                  <td>
                    <button className="btn-red" onClick={() => handleDelete(n.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/* ── Inline styles ── */
const formCardStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 10,
  padding: '24px 28px',
  marginBottom: 8,
  maxWidth: 720,
};
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