import { useEffect, useState } from 'react';
import axios from 'axios';

import { API } from '../config';

export default function SupportPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [replyDrafts, setReplyDrafts] = useState({});
  const [sendingReply, setSendingReply] = useState(null);

  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/support`, { headers });
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id) {
    try {
      await axios.patch(`${API}/api/admin/support/${id}/read`, {}, { headers });
      setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteMessage(id) {
    if (!confirm('Delete this message?')) return;
    try {
      await axios.delete(`${API}/api/admin/support/${id}`, { headers });
      setMessages(prev => prev.filter(m => m.id !== id));
      if (expanded === id) setExpanded(null);
    } catch (err) {
      alert('Failed to delete message.');
    }
  }

  async function sendReply(id) {
    const reply = (replyDrafts[id] || '').trim();
    if (!reply) return;
    setSendingReply(id);
    try {
      const res = await axios.post(`${API}/api/admin/support/${id}/reply`, { reply }, { headers });
      setMessages(prev => prev.map(m => m.id === id ? res.data : m));
      setReplyDrafts(prev => ({ ...prev, [id]: '' }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSendingReply(null);
    }
  }

  function toggleExpand(id) {
    if (expanded !== id) markRead(id);
    setExpanded(prev => prev === id ? null : id);
  }

  const unread = messages.filter(m => !m.is_read).length;

  return (
    <div className="page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <h1 style={{ margin: 0 }}>Support Messages</h1>
        {unread > 0 && (
          <span style={badgeStyle}>{unread} new</span>
        )}
      </div>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 24 }}>
        Messages sent by users through the Contact Support screen in the app.
      </p>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading…</p>
      ) : messages.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No messages yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 720 }}>
          {messages.map(m => (
            <div
              key={m.id}
              style={cardStyle(m.is_read)}
            >
              {/* Header row */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                onClick={() => toggleExpand(m.id)}
              >
                {/* Unread dot */}
                {!m.is_read && <div style={dotStyle}/>}

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#111' }}>{m.name}</span>
                    {!m.is_read && (
                      <span style={{ ...badgeStyle, fontSize: 11, padding: '1px 8px' }}>Unread</span>
                    )}
                    {!m.user_id ? (
                      <span style={{ ...guestBadgeStyle, fontSize: 11, padding: '1px 8px' }}>Guest</span>
                    ) : m.reply ? (
                      <span style={{ ...repliedBadgeStyle, fontSize: 11, padding: '1px 8px' }}>Replied</span>
                    ) : null}
                  </div>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {new Date(m.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Preview / chevron */}
                {expanded !== m.id && (
                  <span style={{ fontSize: 13, color: '#6b7280', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.message}
                  </span>
                )}
                <span style={{ color: '#9ca3af', fontSize: 18, marginLeft: 8 }}>
                  {expanded === m.id ? '▲' : '▼'}
                </span>
              </div>

              {/* Expanded message */}
              {expanded === m.id && (
                <div style={{ marginTop: 14, borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
                  <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {m.message}
                  </p>

                  {!m.user_id ? (
                    <p style={{ fontSize: 12, color: '#b45309', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 10px', marginTop: 14 }}>
                      Sent as a guest — there's no account to reply to.
                    </p>
                  ) : m.reply ? (
                    <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 4 }}>
                        YOUR REPLY · {new Date(m.replied_at).toLocaleString()}
                      </div>
                      <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {m.reply}
                      </p>
                    </div>
                  ) : (
                    <div style={{ marginTop: 14 }}>
                      <textarea
                        value={replyDrafts[m.id] || ''}
                        onChange={e => setReplyDrafts(prev => ({ ...prev, [m.id]: e.target.value }))}
                        placeholder="Write a reply… the user will get this as a notification in the app."
                        rows={3}
                        style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e5e7eb', borderRadius: 10, padding: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    {m.user_id && !m.reply && (
                      <button
                        className="btn-green"
                        onClick={() => sendReply(m.id)}
                        disabled={sendingReply === m.id || !(replyDrafts[m.id] || '').trim()}
                      >
                        {sendingReply === m.id ? 'Sending…' : 'Send Reply'}
                      </button>
                    )}
                    <button
                      className="btn-red"
                      onClick={() => deleteMessage(m.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const badgeStyle = {
  background: '#dcfce7', color: '#16a34a',
  borderRadius: 999, padding: '2px 10px',
  fontSize: 12, fontWeight: 700,
};
const guestBadgeStyle = {
  background: '#fef3c7', color: '#b45309',
  borderRadius: 999, padding: '2px 10px',
  fontSize: 12, fontWeight: 700,
};
const repliedBadgeStyle = {
  background: '#e0f2fe', color: '#0369a1',
  borderRadius: 999, padding: '2px 10px',
  fontSize: 12, fontWeight: 700,
};
const dotStyle = {
  width: 9, height: 9, borderRadius: '50%',
  background: '#16a34a', flexShrink: 0,
};
function cardStyle(isRead) {
  return {
    background: isRead ? '#fff' : '#f0fdf4',
    border: `1px solid ${isRead ? '#e5e7eb' : '#bbf7d0'}`,
    borderLeft: `4px solid ${isRead ? '#e5e7eb' : '#16a34a'}`,
    borderRadius: 10,
    padding: '14px 16px',
  };
}