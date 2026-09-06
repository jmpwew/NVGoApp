import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import './AuditLogsPage.css';

import { API } from '../config';

const ACTION_LABELS = {
  staff_created: 'Staff account created',
  staff_deleted: 'Staff account deleted',
  staff_delete_blocked: 'Staff deletion blocked',
  user_deleted: 'User account deleted',
  user_delete_failed: 'User deletion failed',
  profile_updated: 'Profile updated',
  news_created: 'News published',
  news_updated: 'News updated',
  news_deleted: 'News deleted',
  announcement_created: 'Announcement published',
  announcement_updated: 'Announcement updated',
  announcement_deleted: 'Announcement deleted',
  hotline_created: 'Hotline created',
  hotline_updated: 'Hotline updated',
  hotline_deleted: 'Hotline deleted',
  report_verified: 'Report verified & assigned',
  report_reassigned: 'Report reassigned',
  assignment_status_updated: 'Assignment status updated',
  report_status_updated: 'Report status updated (manual)',
  report_deleted: 'Report deleted',
  quarterly_report_exported: 'Quarterly report exported',
};

const ACTION_OPTIONS = Object.keys(ACTION_LABELS);

const TARGET_TYPE_OPTIONS = [
  'user', 'news', 'announcement', 'hotline', 'report', 'report_assignment', 'report_export',
];

const STATUS_OPTIONS = ['success', 'blocked', 'failed'];

const ROLE_BADGE = {
  admin: 'badge-admin',
  verifier: 'badge-verifier',
  police: 'badge-office-police',
  bfp: 'badge-office-bfp',
  medical: 'badge-office-medical',
};

function statusClass(status) {
  if (status === 'blocked') return 'audit-status audit-status-blocked';
  if (status === 'failed') return 'audit-status audit-status-failed';
  return 'audit-status audit-status-success';
}

function formatAction(action) {
  return ACTION_LABELS[action] || action;
}

function formatTargetType(t) {
  if (!t) return '';
  return t.replace(/_/g, ' ');
}

const PAGE_SIZE = 50;

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const [filters, setFilters] = useState({
    action: '',
    targetType: '',
    status: '',
    from: '',
    to: '',
  });

  const token = localStorage.getItem('token');

  const fetchLogs = useCallback(async (nextOffset = 0) => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: PAGE_SIZE, offset: nextOffset };
      if (filters.action) params.action = filters.action;
      if (filters.targetType) params.targetType = filters.targetType;
      if (filters.status) params.status = filters.status;
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;

      const res = await axios.get(`${API}/api/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setLogs(nextOffset === 0 ? res.data.logs : prev => [...prev, ...res.data.logs]);
      setTotal(res.data.total);
      setOffset(nextOffset);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [filters, token]);

  useEffect(() => {
    fetchLogs(0);
   
  }, [filters]);

  function updateFilter(key, value) {
    setExpandedId(null);
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setFilters({ action: '', targetType: '', status: '', from: '', to: '' });
  }

  const hasMore = logs.length < total;

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1>Audit Logs</h1>
          <p className="page-subtitle">
            A record of staff actions — account changes, publishing, edits, and deletion attempts.
          </p>
        </div>
      </div>

      <div className="audit-filters">
        <select value={filters.action} onChange={e => updateFilter('action', e.target.value)}>
          <option value="">All actions</option>
          {ACTION_OPTIONS.map(a => (
            <option key={a} value={a}>{formatAction(a)}</option>
          ))}
        </select>

        <select value={filters.targetType} onChange={e => updateFilter('targetType', e.target.value)}>
          <option value="">All target types</option>
          {TARGET_TYPE_OPTIONS.map(t => (
            <option key={t} value={t}>{formatTargetType(t)}</option>
          ))}
        </select>

        <select value={filters.status} onChange={e => updateFilter('status', e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.from}
          onChange={e => updateFilter('from', e.target.value)}
          title="From date"
        />
        <input
          type="date"
          value={filters.to}
          onChange={e => updateFilter('to', e.target.value)}
          title="To date"
        />

        <button className="btn-gray" onClick={clearFilters}>Clear filters</button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>When</th>
            <th>Actor</th>
            <th>Action</th>
            <th>Target</th>
            <th>Status</th>
            <th>Reason</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && !loading ? (
            <tr><td colSpan="7" style={{ textAlign: 'center', color: '#aaa' }}>No audit log entries match these filters.</td></tr>
          ) : (
            logs.map(log => {
              const isOpen = expandedId === log.id;
              return (
                <>
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#666' }}>
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{log.actor_name || 'Deleted account'}</div>
                      {log.actor_role && (
                        <span className={`badge ${ROLE_BADGE[log.actor_role] || 'badge-user'}`}>
                          {log.actor_role}
                        </span>
                      )}
                    </td>
                    <td>{formatAction(log.action)}</td>
                    <td>
                      <div style={{ fontSize: 13, color: '#666', textTransform: 'capitalize' }}>
                        {formatTargetType(log.target_type)}
                      </div>
                      <div>{log.target_label || (log.target_id ? `#${log.target_id}` : '—')}</div>
                    </td>
                    <td><span className={statusClass(log.status)}>{log.status}</span></td>
                    <td style={{ maxWidth: 220, fontSize: 13, color: '#666' }}>
                      {log.reason || '—'}
                    </td>
                    <td>
                      {(log.before_state || log.after_state) && (
                        <button
                          className="btn-gray"
                          onClick={() => setExpandedId(isOpen ? null : log.id)}
                        >
                          {isOpen ? 'Hide' : 'Details'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${log.id}-detail`}>
                      <td colSpan="7">
                        <div className="audit-detail">
                          {log.before_state && (
                            <div className="audit-detail-col">
                              <h4>Before</h4>
                              <pre>{JSON.stringify(log.before_state, null, 2)}</pre>
                            </div>
                          )}
                          {log.after_state && (
                            <div className="audit-detail-col">
                              <h4>After</h4>
                              <pre>{JSON.stringify(log.after_state, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })
          )}
        </tbody>
      </table>

      <div className="audit-footer">
        <span className="audit-count">{logs.length} of {total} entries</span>
        {hasMore && (
          <button className="btn-gray" onClick={() => fetchLogs(offset + PAGE_SIZE)} disabled={loading}>
            {loading ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
