import { useEffect, useState } from 'react';
import axios from 'axios';
import './DashboardPage.css';

const API = 'http://localhost:5000';

export default function DashboardPage() {
  const [stats, setStats]     = useState(null);
  const [reports, setReports] = useState([]);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchStats();
    fetchRecentReports();
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

  return (
    <div className="page">
      <h1>Dashboard</h1>

      {/* Stats cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Total Reports</h3>
          <div className="number">{stats ? stats.totalReports : '...'}</div>
        </div>
        <div className="stat-card pending">
          <h3>Pending</h3>
          <div className="number">{stats ? stats.pendingReports : '...'}</div>
        </div>
        <div className="stat-card resolved">
          <h3>Resolved</h3>
          <div className="number">{stats ? stats.resolvedReports : '...'}</div>
        </div>
        <div className="stat-card users">
          <h3>Total Users</h3>
          <div className="number">{stats ? stats.totalUsers : '...'}</div>
        </div>
        <div className="stat-card news">
          <h3>News Posts</h3>
          <div className="number">{stats ? stats.totalNews : '...'}</div>
        </div>
      </div>

      {/* Recent reports */}
      <div className="recent-section">
        <h2>Recent Reports</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan="4">No reports yet.</td></tr>
            ) : (
              reports.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.description.substring(0, 60)}...</td>
                  <td>
                    <span className={`badge badge-${r.status}`}>{r.status}</span>
                  </td>
                  <td>{new Date(r.created_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
