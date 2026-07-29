import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import UserGrowthChart from '../components/UserGrowthChart';
import './DashboardPage.css';

import { API } from '../config';

function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?';
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [reports, setReports] = useState([]);
  const [growth, setGrowth]   = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStats();
    fetchRecentReports();
    fetchUserGrowth();

    // Keep the metric cards and recent-reports list fresh without a manual
    // refresh, same 5s cadence as ReportsPage/App.jsx. Growth chart is left
    // out - monthly signup counts don't need second-by-second freshness.
    const interval = setInterval(() => {
      fetchStats();
      fetchRecentReports();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

  async function fetchUserGrowth() {
    try {
      const res = await axios.get(`${API}/api/admin/users/growth`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGrowth(res.data);
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <div className="page">

      <div className="page-header-row">
        <div>
          <h1>Dashboard</h1>
          
        </div>
        <div className="live-chip">
          <span className={`live-chip-dot ${!stats || stats.pendingReports === 0 ? 'calm' : ''}`} />
          {stats ? `${stats.pendingReports} pending` : 'Loading…'}
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

      {/* User growth chart */}
      <div className="chart-section">
        <h2>User growth</h2>
        <div className="chart-subtitle">
          New users per month{growth ? ` — ${growth.year}` : ''}
        </div>
        {growth ? (
          <UserGrowthChart months={growth.months} counts={growth.counts} />
        ) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
            Loading chart...
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