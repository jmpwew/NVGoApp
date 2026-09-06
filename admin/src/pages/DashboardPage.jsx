import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserGrowthChart from '../components/UserGrowthChart';
import QuarterlyLogsModal from '../components/QuarterlyLogsModal';
import './DashboardPage.css';

import { API } from '../config';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

const GROWTH_METRICS = [
  { key: 'users',         label: 'Users',         noun: 'users',         color: 'var(--brand-dark)' },
  { key: 'reports',       label: 'Reports',       noun: 'reports',       color: 'var(--danger)' },
  { key: 'news',          label: 'News',          noun: 'news posts',    color: 'var(--info)' },
  { key: 'announcements', label: 'Announcements', noun: 'announcements', color: '#c2410c' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [reports, setReports] = useState([]);
  const [growth, setGrowth]   = useState(null);
  const [growthLoading, setGrowthLoading] = useState(true);
  const [metric, setMetric]   = useState('users');
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStats();
    fetchRecentReports();

    const interval = setInterval(() => {
      fetchStats();
      fetchRecentReports();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchGrowth(metric);
  }, [metric]);

  async function fetchStats() {
    try {
      const res = await axios.get(`${API}/api/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchRecentReports() {
    try {
      const res = await axios.get(`${API}/api/admin/reports`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Only show the 5 most recent
      setReports(res.data.slice(0, 5));
    } catch (err) {
      console.log(err);
    }
  }

  async function fetchGrowth(m) {
    setGrowthLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/users/growth`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { metric: m },
      });
      setGrowth(res.data);
    } catch (err) {
      console.log(err);
    } finally {
      setGrowthLoading(false);
    }
  }

  return (
    <div className="page">

      <div className="page-header-row">
        <div>
          <h1>Dashboard</h1>
          
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="live-chip">
            <span className={`live-chip-dot ${!stats || stats.pendingReports === 0 ? 'calm' : ''}`} />
            {stats ? `${stats.pendingReports} pending` : 'Loading…'}
          </div>
          <QuarterlyLogsModal endpoint={`${API}/api/admin/reports/quarterly`} />
        </div>
      </div>

      {/* Metric cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-card-label">Total reports</div>
          <div className="metric-card-value">{stats ? stats.totalReports : '—'}</div>
        </div>
        <div className={`metric-card ${stats && stats.pendingReports > 0 ? 'accent' : ''}`}>
          <div className="metric-card-label">Pending</div>
          <div className="metric-card-value">{stats ? stats.pendingReports : '—'}</div>
        </div>
        <div className="metric-card metric-card-resolved">
          <div className="metric-card-label">Resolved</div>
          <div className="metric-card-value">{stats ? stats.resolvedReports : '—'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">Total users</div>
          <div className="metric-card-value">{stats ? stats.totalUsers : '—'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-card-label">News posts</div>
          <div className="metric-card-value">{stats ? stats.totalNews : '—'}</div>
        </div>
      </div>

      {/* Growth chart with metric tabs */}
      <div className="chart-section">
        <h2>Growth</h2>
        <div className="chart-tabs">
          {GROWTH_METRICS.map(m => (
            <button
              key={m.key}
              className={`chart-tab ${metric === m.key ? 'active' : ''}`}
              style={metric === m.key ? { '--chart-accent': m.color } : undefined}
              onClick={() => setMetric(m.key)}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="chart-subtitle">
          New {GROWTH_METRICS.find(m => m.key === metric)?.noun} per month{growth ? ` — ${growth.year}` : ''}
        </div>
        {growthLoading || !growth ? (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Loading chart...
          </div>
        ) : (
          <div style={{ '--chart-accent': GROWTH_METRICS.find(m => m.key === metric)?.color }}>
            <UserGrowthChart
              months={growth.months}
              counts={growth.counts}
              label={`Bar chart of new ${GROWTH_METRICS.find(m => m.key === metric)?.noun} per month for the current year`}
            />
          </div>
        )}
      </div>

      {/* Recent reports */}
      <div className="recent-section">
        <div className="page-header-row" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>Recent reports</h2>
          <button
            className="btn-gray"
            onClick={() => navigate('/reports')}
          >
            See more
          </button>
        </div>
        {reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No reports yet</div>
            <div className="empty-state-text">New reports will show up here as they come in.</div>
          </div>
        ) : (
          <div className="case-card-list">
            {reports.map(r => (
              <div
                key={r.id}
                className={`case-card ${r.status === 'resolved' ? 'is-resolved' : ''}`}
                onClick={() => navigate(`/reports?reportId=${r.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <div className={`case-card-stripe status-${r.status}`} />
                <div className="avatar-circle">{initials(r.name)}</div>
                <div className="case-card-body">
                  <div className="case-card-top">
                    <span className="case-card-name">{r.name || 'Anonymous'}</span>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </div>
                  <div className="case-card-desc">{r.description}</div>
                </div>
                <span className="case-card-time">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}